import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import { db, schema, type Tx } from "./db";
import { paystackMockMode, refundTransaction } from "./paystack";

const { orders, orderItems, products, teams, teamMembers } = schema;

async function commitStock(tx: Tx, orderId: string) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const it of items) {
    await tx
      .update(products)
      .set({
        stock: sql`greatest(${products.stock} - ${it.quantity}, 0)`,
        soldCount: sql`${products.soldCount} + ${it.quantity}`,
      })
      .where(eq(products.id, it.productId));
  }
}

/**
 * Mark an order paid. Safe to call many times (callback + webhook both call it):
 * only the first call that flips PENDING_PAYMENT does any work.
 */
export async function markOrderPaid(code: string, amountKobo: number) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.code, code)).for("update");
    if (!order) throw new Error(`Order ${code} not found`);
    if (order.status !== "PENDING_PAYMENT") return order; // already handled
    if (amountKobo < order.total) throw new Error(`Underpaid order ${code}`);

    const nextStatus = order.teamId ? "AWAITING_TEAM" : "PROCESSING";
    await tx.update(orders).set({ status: nextStatus, paidAt: new Date() }).where(eq(orders.id, order.id));

    if (!order.teamId) {
      await commitStock(tx, order.id);
      return { ...order, status: nextStatus };
    }

    // Team-Up: record payment, then check whether the team is now full.
    await tx.update(teamMembers).set({ paid: true }).where(eq(teamMembers.orderId, order.id));
    const [team] = await tx.select().from(teams).where(eq(teams.id, order.teamId)).for("update");
    const [{ paidCount }] = await tx
      .select({ paidCount: sql<number>`count(*)::int` })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.paid, true)));

    if (team.status === "OPEN" && paidCount >= team.size) {
      await tx.update(teams).set({ status: "COMPLETE" }).where(eq(teams.id, team.id));
      const waiting = await tx
        .select()
        .from(orders)
        .where(and(eq(orders.teamId, team.id), eq(orders.status, "AWAITING_TEAM")));
      for (const o of waiting) {
        await tx.update(orders).set({ status: "PROCESSING" }).where(eq(orders.id, o.id));
        await commitStock(tx, o.id);
      }
      return { ...order, status: "PROCESSING" as const };
    }
    return { ...order, status: nextStatus };
  });
}

/** Pay-on-delivery orders skip payment and go straight to the seller. */
export async function confirmPodOrder(tx: Tx, orderId: string) {
  await tx.update(orders).set({ status: "PROCESSING" }).where(eq(orders.id, orderId));
  await commitStock(tx, orderId);
}

/**
 * Close Team-Ups whose window passed without filling up.
 * Paid members are refunded in full; unpaid orders are cancelled.
 * Run every few minutes (Vercel Cron hits /api/cron/expire-teams).
 */
export async function expireTeams(now = new Date()) {
  const expired = await db
    .update(teams)
    .set({ status: "EXPIRED" })
    .where(and(eq(teams.status, "OPEN"), lt(teams.expiresAt, now)))
    .returning();

  let refunded = 0;
  for (const team of expired) {
    const teamOrders = await db.select().from(orders).where(eq(orders.teamId, team.id));
    for (const o of teamOrders) {
      if (o.status === "AWAITING_TEAM") {
        if (!paystackMockMode()) await refundTransaction(o.code);
        await db.update(orders).set({ status: "REFUNDED" }).where(eq(orders.id, o.id));
        refunded++;
      } else if (o.status === "PENDING_PAYMENT") {
        await db.update(orders).set({ status: "CANCELLED" }).where(eq(orders.id, o.id));
      }
    }
  }
  return { expired: expired.length, refunded };
}

export const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  AWAITING_TEAM: "Waiting for team",
  PROCESSING: "Being packed",
  SHIPPED: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};
