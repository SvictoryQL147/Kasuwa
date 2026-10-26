import { NextResponse } from "next/server";
import { z } from "zod";
import { chat } from "@/lib/assistant";

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1000) })).min(1).max(30),
});

// Basic per-IP limiter. Swap for Upstash Ratelimit when running on multiple instances.
const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) { hits.set(ip, { n: 1, reset: now + 60_000 }); return false; }
  h.n++;
  return h.n > 15;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (limited(ip)) return NextResponse.json({ error: "Too many messages, wait a minute." }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    return NextResponse.json(await chat(parsed.data.messages));
  } catch (e) {
    console.error("assistant error", e);
    return NextResponse.json({ error: "The assistant is busy. Try again shortly." }, { status: 500 });
  }
}
