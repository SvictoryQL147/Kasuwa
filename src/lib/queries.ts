import "server-only";
import { and, asc, desc, eq, gt, ilike, isNotNull, lte, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "./db";

const { products, stores, categories, teams, teamMembers, users } = schema;

/** Columns every product card needs. */
export const cardSelect = {
  id: products.id,
  slug: products.slug,
  title: products.title,
  images: products.images,
  price: products.price,
  compareAtPrice: products.compareAtPrice,
  teamPrice: products.teamPrice,
  teamSize: products.teamSize,
  rating: products.rating,
  ratingCount: products.ratingCount,
  soldCount: products.soldCount,
  expressEligible: products.expressEligible,
  stock: products.stock,
  categorySlug: categories.slug,
  storeName: stores.name,
  storeVerified: stores.verified,
  shipsFromState: products.shipsFromState,
};

export type ProductCardData = {
  id: string; slug: string; title: string; images: string[]; price: number; compareAtPrice: number | null;
  teamPrice: number | null; teamSize: number | null; rating: number; ratingCount: number; soldCount: number;
  expressEligible: boolean; stock: number; categorySlug: string; storeName: string; storeVerified: boolean;
  shipsFromState: string;
};

const base = () =>
  db
    .select(cardSelect)
    .from(products)
    .innerJoin(stores, eq(products.storeId, stores.id))
    .innerJoin(categories, eq(products.categoryId, categories.id));

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.sort));
}

export type SearchParams = {
  q?: string;
  category?: string;
  maxPrice?: number; // kobo
  express?: boolean;
  team?: boolean;
  verified?: boolean;
  sort?: "popular" | "price-asc" | "price-desc" | "rating" | "new";
  limit?: number;
};

export async function searchProducts(p: SearchParams): Promise<ProductCardData[]> {
  const where: SQL[] = [eq(products.status, "ACTIVE"), gt(products.stock, 0)];

  if (p.q?.trim()) {
    // Match every word somewhere in title, tags or description.
    for (const word of p.q.trim().toLowerCase().split(/\s+/).slice(0, 6)) {
      const like = `%${word}%`;
      where.push(
        or(
          ilike(products.title, like),
          ilike(products.description, like),
          sql`exists (select 1 from unnest(${products.tags}) t where t ilike ${like})`,
        )!,
      );
    }
  }
  if (p.category) where.push(eq(categories.slug, p.category));
  if (p.maxPrice) where.push(lte(products.price, p.maxPrice));
  if (p.express) where.push(eq(products.expressEligible, true));
  if (p.team) where.push(isNotNull(products.teamPrice));
  if (p.verified) where.push(eq(stores.verified, true));

  const order =
    p.sort === "price-asc" ? [asc(products.price)]
    : p.sort === "price-desc" ? [desc(products.price)]
    : p.sort === "rating" ? [desc(products.rating), desc(products.ratingCount)]
    : p.sort === "new" ? [desc(products.createdAt)]
    : [desc(products.soldCount)];

  return base().where(and(...where)).orderBy(...order).limit(p.limit ?? 48);
}

export async function getProductBySlug(slug: string) {
  return db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: { store: true, category: true },
  });
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  return db.query.products.findMany({
    where: (p, { inArray }) => inArray(p.id, ids),
    with: { store: true },
  });
}

/** Open Team-Ups for a product that a shopper can join right now. */
export async function getOpenTeams(productId: string) {
  return db
    .select({
      code: teams.code,
      size: teams.size,
      expiresAt: teams.expiresAt,
      leaderName: users.name,
      joined: sql<number>`(select count(*)::int from ${teamMembers} tm where tm.team_id = ${teams.id} and tm.paid)`,
    })
    .from(teams)
    .innerJoin(users, eq(teams.leaderId, users.id))
    .where(and(eq(teams.productId, productId), eq(teams.status, "OPEN"), gt(teams.expiresAt, new Date())))
    .orderBy(asc(teams.expiresAt))
    .limit(5);
}

export async function getTeamByCode(code: string) {
  return db.query.teams.findFirst({
    where: eq(teams.code, code.toUpperCase()),
    with: {
      product: { with: { store: true } },
      leader: { columns: { name: true } },
      members: { with: { user: { columns: { name: true } } } },
    },
  });
}
