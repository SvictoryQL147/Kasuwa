"use server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { orderCode, teamCode } from "@/lib/codes";
import { db, schema } from "@/lib/db";
import { deliveryOptions, podAllowed } from "@/lib/delivery";
import { confirmPodOrder } from "@/lib/orders";
import { initializeTransaction, paystackMockMode } from "@/lib/paystack";
import { normalisePhone } from "@/lib/nigeria";
import { parseItems } from "@/lib/cart-items";
import { COMMISSION_BPS, SITE, TEAM_DURATION_HOURS } from "@/lib/site";

const { products, orders, orderItems, teams, teamMembers, deliveryRates, pickupPoints } = schema;

export type CheckoutState = { error?: string } | undefined;

const Input = z.object({
  mode: z.enum(["cart", "team-new", "team-join"]),
  items: z.string().default(""), // "productId:qty,productId:qty"
  productId: z.string().optional(),
  teamCode: z.string().optional(),
  fullName: z.string().trim().min(2, "Enter the receiver's name"),
  phone: z.string(),
  state: z.string().min(2, "Choose a state"),
  city: z.string().trim().min(2, "Enter your city / area"),
  street: z.string().trim().optional(),
  deliveryMethod: z.enum(["EXPRESS", "STANDARD", "PICKUP"]),
  pickupPointId: z.string().optional(),
  paymentMethod: z.enum(["PAYSTACK", "POD"]),
});

export async function placeOrder(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const user = await requireUser("/checkout");
  const parsed = Input.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;

  const phone = normalisePhone(input.phone);
  if (!phone) return { error: "Enter a valid Nigerian phone number for delivery" };
  if (input.deliveryMethod !== "PICKUP" && !input.street) return { error: "Enter a street address" };

  const isTeam = input.mode !== "cart";

  // 1. Work out what is being bought, priced from the database (never trust the client).
  const wanted = isTeam ? new Map([[input.productId ?? "", 1]]) : parseItems(input.items);
  const rows = await db.query.products.findMany({
    where: and(inArray(products.id, [...wanted.keys()]), eq(products.status, "ACTIVE")),
  });
  if (rows.length === 0 || rows.length !== wanted.size) return { error: "Some items are no longer available" };
  for (const p of rows) {
    if (p.stock < (wanted.get(p.id) ?? 0)) return { error: `Only ${p.stock} left of ${p.title}` };
  }

  // 2. Team-Up validation
  let team: typeof teams.$inferSelect | undefined;
  const product = rows[0];
  if (isTeam) {
    if (!product.teamPrice || !product.teamSize) return { error: "This product has no Team-Up price" };
    if (input.mode === "team-join") {
      team = await db.query.teams.findFirst({ where: eq(teams.code, (input.teamCode ?? "").toUpperCase()) });
      if (!team || team.productId !== product.id) return { error: "That team link isn't valid" };
      if (team.status !== "OPEN" || team.expiresAt < new Date()) return { error: "This team has closed. Start a new one!" };
      const mine = await db.query.teamMembers.findFirst({
        where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, user.id)),
        with: { order: true },
      });
      if (mine) {
        if (mine.order.status === "PENDING_PAYMENT") return { error: "You already joined. Finish payment from My orders." };
        return { error: "You're already in this team. Share the link to fill it faster!" };
      }
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(teamMembers)
        .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.paid, true)));
      if (n >= team.size) return { error: "This team just filled up. Start your own!" };
    }
  }

  // 3. Prices + delivery
  const unitPrice = (p: (typeof rows)[number]) => (isTeam ? (team?.unitPrice ?? p.teamPrice!) : p.price);
  const subtotal = rows.reduce((s, p) => s + unitPrice(p) * (wanted.get(p.id) ?? 0), 0);

  const rate = await db.query.deliveryRates.findFirst({ where: eq(deliveryRates.state, input.state) });
  const points = await db.select().from(pickupPoints).where(eq(pickupPoints.state, input.state));
  const options = deliveryOptions({
    rate: rate ?? null,
    subtotal,
    allExpressEligible: rows.every((p) => p.expressEligible && p.shipsFromState === input.state),
    pickupPoints: points,
  });
  const chosen = options.find((o) => o.method === input.deliveryMethod);
  if (!chosen?.available) return { error: chosen?.reason ?? "That delivery option isn't available" };

  let deliveryFee = chosen.fee;
  if (input.deliveryMethod === "PICKUP") {
    const pp = points.find((p) => p.id === input.pickupPointId);
    if (!pp) return { error: "Choose a pickup point" };
    deliveryFee = pp.fee;
  }
  const total = subtotal + deliveryFee;

  if (input.paymentMethod === "POD") {
    const pod = podAllowed(rate ?? null, total, isTeam);
    if (!pod.ok) return { error: pod.reason };
  }

  // 4. Persist
  const code = orderCode();
  await db.transaction(async (tx) => {
    if (input.mode === "team-new") {
      [team] = await tx
        .insert(teams)
        .values({
          code: teamCode(),
          productId: product.id,
          leaderId: user.id,
          size: product.teamSize!,
          unitPrice: product.teamPrice!,
          expiresAt: new Date(Date.now() + TEAM_DURATION_HOURS * 3600_000),
        })
        .returning();
    }

    const [order] = await tx
      .insert(orders)
      .values({
        code,
        buyerId: user.id,
        paymentMethod: input.paymentMethod,
        deliveryMethod: input.deliveryMethod,
        subtotal,
        deliveryFee,
        total,
        fullName: input.fullName,
        phone,
        state: input.state,
        city: input.city,
        street: input.deliveryMethod === "PICKUP" ? null : input.street,
        pickupPointId: input.deliveryMethod === "PICKUP" ? input.pickupPointId : null,
        teamId: team?.id,
      })
      .returning();

    await tx.insert(orderItems).values(
      rows.map((p) => {
        const qty = wanted.get(p.id)!;
        const lineTotal = unitPrice(p) * qty;
        return {
          orderId: order.id,
          productId: p.id,
          storeId: p.storeId,
          title: p.title,
          unitPrice: unitPrice(p),
          quantity: qty,
          commission: Math.round((lineTotal * COMMISSION_BPS) / 10_000),
        };
      }),
    );

    if (team) await tx.insert(teamMembers).values({ teamId: team.id, userId: user.id, orderId: order.id });
    if (input.paymentMethod === "POD") await confirmPodOrder(tx, order.id);
  });

  const from = input.mode === "cart" ? "&from=cart" : "";
  if (input.paymentMethod === "POD") redirect(`/orders/${code}?new=1${from}`);

  // 5. Pay with Paystack (or the local mock when no keys are configured)
  if (paystackMockMode()) redirect(`/pay/mock/${code}?${from.slice(1)}`);
  let authorizationUrl: string;
  try {
    const tx = await initializeTransaction({
      email: user.email,
      amountKobo: total,
      reference: code,
      callbackUrl: `${SITE.url}/api/paystack/callback${from ? "?from=cart" : ""}`,
      metadata: { orderCode: code, teamCode: team?.code, phone },
    });
    authorizationUrl = tx.authorization_url;
  } catch (e) {
    console.error("Paystack initialize failed", e);
    return { error: `Couldn't reach the payment provider. Your order ${code} is saved. Retry from My orders.` };
  }
  redirect(authorizationUrl);
}
