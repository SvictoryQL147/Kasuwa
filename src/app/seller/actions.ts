"use server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, requireSeller, requireUser } from "@/lib/auth";
import { shortCode, slugify } from "@/lib/codes";
import { db, schema } from "@/lib/db";
import { NIGERIAN_STATES } from "@/lib/nigeria";

export type FormState = { error?: string } | undefined;

const StoreInput = z.object({
  name: z.string().trim().min(3, "Store name is too short").max(60),
  description: z.string().trim().max(500).optional(),
  state: z.enum(NIGERIAN_STATES, { message: "Choose your state" }),
  city: z.string().trim().min(2, "Enter your city"),
  bankName: z.string().trim().min(2, "Enter your bank"),
  accountNumber: z.string().regex(/^\d{10}$/, "NUBAN account number must be 10 digits"),
  accountName: z.string().trim().min(3, "Enter the account name"),
});

export async function createStore(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/sell");
  if (user.store) redirect("/seller");
  const parsed = StoreInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let slug = slugify(parsed.data.name);
  if (await db.query.stores.findFirst({ where: eq(schema.stores.slug, slug) })) slug = `${slug}-${shortCode(4).toLowerCase()}`;

  await db.transaction(async (tx) => {
    await tx.insert(schema.stores).values({ ...parsed.data, ownerId: user.id, slug });
    await tx.update(schema.users).set({ role: "SELLER" }).where(eq(schema.users.id, user.id));
  });
  // TODO(phase 2): create a Paystack subaccount (POST /subaccount) for automatic split payouts.
  await createSession({ userId: user.id, role: "SELLER", name: user.name });
  redirect("/seller");
}

const naira = z.coerce.number().positive();
const ProductInput = z
  .object({
    title: z.string().trim().min(5, "Title is too short").max(120),
    description: z.string().trim().min(20, "Describe the item in at least 20 characters"),
    categoryId: z.string().min(1, "Choose a category"),
    price: naira,
    compareAtPrice: z.union([naira, z.literal("")]).optional(),
    stock: z.coerce.number().int().min(0),
    teamPrice: z.union([naira, z.literal("")]).optional(),
    teamSize: z.union([z.coerce.number().int().min(2).max(10), z.literal("")]).optional(),
    imageUrl: z.union([z.string().url("Image must be a link (https://…)"), z.literal("")]).optional(),
    tags: z.string().optional(),
    expressEligible: z.literal("on").optional(),
  })
  .refine((d) => !d.teamPrice || (d.teamSize && d.teamPrice < d.price), {
    message: "Team price must be lower than the normal price and needs a team size",
  });

export async function createProduct(_: FormState, form: FormData): Promise<FormState> {
  const { store } = await requireSeller();
  const parsed = ProductInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const k = (n: number | "" | undefined) => (n ? Math.round(n * 100) : null);

  await db.insert(schema.products).values({
    storeId: store.id,
    categoryId: d.categoryId,
    title: d.title,
    slug: `${slugify(d.title)}-${shortCode(4).toLowerCase()}`,
    description: d.description,
    images: d.imageUrl ? [d.imageUrl] : [],
    tags: (d.tags ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    price: Math.round(d.price * 100),
    compareAtPrice: k(d.compareAtPrice),
    teamPrice: k(d.teamPrice),
    teamSize: d.teamPrice && d.teamSize ? Number(d.teamSize) : null,
    stock: d.stock,
    shipsFromState: store.state,
    expressEligible: d.expressEligible === "on",
  });
  revalidatePath("/");
  redirect("/seller");
}

/** Seller moves an order forward. Only allowed for orders containing this store's items. */
export async function advanceOrder(form: FormData) {
  const { store } = await requireSeller();
  const orderId = String(form.get("orderId"));
  const to = String(form.get("to")) as "SHIPPED" | "DELIVERED";
  const from = to === "SHIPPED" ? "PROCESSING" : "SHIPPED";

  const mine = await db
    .select({ id: schema.orderItems.orderId })
    .from(schema.orderItems)
    .where(and(eq(schema.orderItems.orderId, orderId), eq(schema.orderItems.storeId, store.id)))
    .limit(1);
  if (!mine.length) return;

  await db
    .update(schema.orders)
    .set(to === "SHIPPED" ? { status: to, shippedAt: new Date() } : { status: to, deliveredAt: new Date() })
    .where(and(eq(schema.orders.id, orderId), inArray(schema.orders.status, [from])));
  revalidatePath("/seller");
}
