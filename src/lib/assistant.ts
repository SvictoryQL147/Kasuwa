import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { naira } from "./money";
import { getCategories, searchProducts, type ProductCardData } from "./queries";
import { SITE } from "./site";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type AssistantProduct = Pick<ProductCardData, "id" | "slug" | "title" | "price" | "teamPrice" | "teamSize" | "rating" | "expressEligible" | "categorySlug" | "images">;

const SYSTEM = `You are ${SITE.name}'s shopping assistant, for a Nigerian online marketplace.
- Reply in the SAME language the shopper uses: English, Nigerian Pidgin, Yoruba, Igbo or Hausa. Keep it warm, short and practical (2–5 sentences).
- ALWAYS call search_products before recommending anything. Never invent products, prices or stock.
- Prices are in naira (₦). Mention when a Team-Up price is available ("buy with N people and pay ₦X") because it saves money.
- Mention Express (same-day) delivery when relevant and the item is express-eligible.
- If nothing matches, say so honestly and suggest a broader search.
- Do not discuss topics unrelated to shopping on ${SITE.name}.
- Recommend at most 4 products, referring to them by name. The UI shows product cards for every product you were given by the tool.`;

const tools: Anthropic.Tool[] = [
  {
    name: "search_products",
    description: "Search the marketplace catalogue. Use short English keywords even if the shopper wrote in another language (e.g. 'rice', 'power bank', 'ankara dress').",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords, e.g. 'phone big battery'" },
        category: { type: "string", description: "Optional category slug" },
        max_price_naira: { type: "number", description: "Optional budget ceiling in naira" },
        team_deals_only: { type: "boolean" },
        express_only: { type: "boolean" },
        sort: { type: "string", enum: ["popular", "price-asc", "rating"] },
      },
      required: [],
    },
  },
];

const slim = (p: ProductCardData): AssistantProduct => ({
  id: p.id, slug: p.slug, title: p.title, price: p.price, teamPrice: p.teamPrice, teamSize: p.teamSize,
  rating: p.rating, expressEligible: p.expressEligible, categorySlug: p.categorySlug, images: p.images,
});

async function runSearch(input: Record<string, unknown>) {
  const results = await searchProducts({
    q: typeof input.query === "string" ? input.query : undefined,
    category: typeof input.category === "string" ? input.category : undefined,
    maxPrice: typeof input.max_price_naira === "number" ? Math.round(input.max_price_naira * 100) : undefined,
    team: input.team_deals_only === true,
    express: input.express_only === true,
    sort: (input.sort as "popular" | "price-asc" | "rating") ?? "popular",
    limit: 6,
  });
  return results;
}

export async function chat(messages: ChatMessage[]): Promise<{ reply: string; products: AssistantProduct[] }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallback(messages);

  const client = new Anthropic({ apiKey: key });
  const cats = (await getCategories()).map((c) => c.slug).join(", ");
  const convo: Anthropic.MessageParam[] = messages.slice(-12).map((m) => ({ role: m.role, content: m.content }));
  const shown = new Map<string, AssistantProduct>();

  for (let turn = 0; turn < 4; turn++) {
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 600,
      system: `${SYSTEM}\nCategory slugs: ${cats}.`,
      tools,
      messages: convo,
    });

    if (res.stop_reason !== "tool_use") {
      const reply = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n").trim();
      return { reply: reply || "Sorry, I couldn't find that. Try different words?", products: [...shown.values()].slice(0, 6) };
    }

    convo.push({ role: "assistant", content: res.content });
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== "tool_use") continue;
      const found = await runSearch(block.input as Record<string, unknown>);
      found.forEach((p) => shown.set(p.id, slim(p)));
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(
          found.map((p) => ({
            title: p.title, price: naira(p.price),
            team: p.teamPrice ? `${naira(p.teamPrice)} with ${p.teamSize} people` : null,
            rating: p.rating, sold: p.soldCount, express: p.expressEligible, seller: p.storeName, verified: p.storeVerified,
          })),
        ),
      });
    }
    convo.push({ role: "user", content: toolResults });
  }
  return { reply: "Here's what I found:", products: [...shown.values()].slice(0, 6) };
}

/** Works with no API key: simple keyword search so the widget is still useful in development. */
async function fallback(messages: ChatMessage[]) {
  const last = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  const budget = last.match(/(?:₦|n|under|below|less than)\s?([\d,]+)\s?(k)?/i);
  const maxPrice = budget ? Number(budget[1].replace(/,/g, "")) * (budget[2] ? 1000 : 1) * 100 : undefined;
  const STOP = /\b(i|want|need|a|an|the|for|me|show|find|buy|abeg|wetin|dey|get|cheap|best|good|under|below|less|than|with|and|of|to|please|pls|some)\b/gi;
  const q = last.replace(/[₦\d,]+k?/gi, " ").replace(STOP, " ").replace(/\s+/g, " ").trim();
  let products = await searchProducts({ q, maxPrice, sort: /cheap/i.test(last) ? "price-asc" : "popular", limit: 4 });
  if (!products.length && q.includes(" ")) {
    products = await searchProducts({ q: q.split(" ")[0], maxPrice, limit: 4 });
  }
  return {
    reply: products.length
      ? `Here are some good matches${maxPrice ? ` under ${naira(maxPrice)}` : ""}. (Add an ANTHROPIC_API_KEY to switch on full AI chat in Pidgin, Yoruba, Igbo & Hausa.)`
      : "I couldn't find a match. Try a simpler word like “phone”, “rice” or “shoes”.",
    products: products.map(slim),
  };
}
