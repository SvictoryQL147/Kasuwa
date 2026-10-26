// Kasuwa: Nigeria-first multi-vendor marketplace
// All money values are stored in KOBO (₦1 = 100 kobo) as integers.
import { relations } from "drizzle-orm";
import {
  boolean, doublePrecision, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

const id = () => text("id").primaryKey().$defaultFn(() => createId());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const roleEnum = pgEnum("role", ["BUYER", "SELLER", "ADMIN"]);
export const productStatusEnum = pgEnum("product_status", ["ACTIVE", "DRAFT", "ARCHIVED"]);
export const orderStatusEnum = pgEnum("order_status", [
  "PENDING_PAYMENT",
  "AWAITING_TEAM", // paid, waiting for the Team-Up to fill
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);
export const paymentMethodEnum = pgEnum("payment_method", ["PAYSTACK", "POD"]);
export const deliveryMethodEnum = pgEnum("delivery_method", ["EXPRESS", "STANDARD", "PICKUP"]);
export const teamStatusEnum = pgEnum("team_status", ["OPEN", "COMPLETE", "EXPIRED"]);

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("BUYER"),
  createdAt: createdAt(),
});

export const stores = pgTable("stores", {
  id: id(),
  ownerId: text("owner_id").notNull().unique().references(() => users.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  logoUrl: text("logo_url"),
  state: text("state").notNull(),
  city: text("city").notNull(),
  verified: boolean("verified").notNull().default(false),
  rating: doublePrecision("rating").notNull().default(0),
  // Payouts via Paystack subaccounts / transfers
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountName: text("account_name"),
  paystackSubaccountCode: text("paystack_subaccount_code"),
  createdAt: createdAt(),
});

export const categories = pgTable("categories", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull(),
  sort: integer("sort").notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: id(),
    storeId: text("store_id").notNull().references(() => stores.id),
    categoryId: text("category_id").notNull().references(() => categories.id),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    images: text("images").array().notNull().default([]),
    tags: text("tags").array().notNull().default([]),
    price: integer("price").notNull(), // kobo, buy-alone price
    compareAtPrice: integer("compare_at_price"), // kobo, "was" price
    stock: integer("stock").notNull().default(0),
    // Team-Up: cheaper price unlocked when `teamSize` people buy together
    teamPrice: integer("team_price"),
    teamSize: integer("team_size"),
    shipsFromState: text("ships_from_state").notNull(),
    expressEligible: boolean("express_eligible").notNull().default(false),
    rating: doublePrecision("rating").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    soldCount: integer("sold_count").notNull().default(0),
    status: productStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: createdAt(),
  },
  (t) => [index("products_category_idx").on(t.categoryId, t.status), index("products_store_idx").on(t.storeId)],
);

// Delivery pricing per state. Express = same/next-day in metro hubs.
export const deliveryRates = pgTable("delivery_rates", {
  id: id(),
  state: text("state").notNull().unique(),
  standardFee: integer("standard_fee").notNull(),
  standardMinDays: integer("standard_min_days").notNull(),
  standardMaxDays: integer("standard_max_days").notNull(),
  expressAvailable: boolean("express_available").notNull().default(false),
  expressFee: integer("express_fee"),
  podAvailable: boolean("pod_available").notNull().default(false),
});

export const pickupPoints = pgTable("pickup_points", {
  id: id(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  hours: text("hours").notNull(),
  fee: integer("fee").notNull(),
});

export const teams = pgTable(
  "teams",
  {
    id: id(),
    code: text("code").notNull().unique(),
    productId: text("product_id").notNull().references(() => products.id),
    leaderId: text("leader_id").notNull().references(() => users.id),
    size: integer("size").notNull(),
    unitPrice: integer("unit_price").notNull(), // locked team price, kobo
    status: teamStatusEnum("status").notNull().default("OPEN"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("teams_product_idx").on(t.productId, t.status)],
);

export const orders = pgTable(
  "orders",
  {
    id: id(),
    code: text("code").notNull().unique(), // human ref + Paystack reference
    buyerId: text("buyer_id").notNull().references(() => users.id),
    status: orderStatusEnum("status").notNull().default("PENDING_PAYMENT"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    deliveryMethod: deliveryMethodEnum("delivery_method").notNull(),
    subtotal: integer("subtotal").notNull(),
    deliveryFee: integer("delivery_fee").notNull(),
    total: integer("total").notNull(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    state: text("state").notNull(),
    city: text("city").notNull(),
    street: text("street"),
    pickupPointId: text("pickup_point_id").references(() => pickupPoints.id),
    teamId: text("team_id").references(() => teams.id),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("orders_buyer_idx").on(t.buyerId)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull().references(() => products.id),
    storeId: text("store_id").notNull().references(() => stores.id),
    title: text("title").notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    commission: integer("commission").notNull(), // platform cut, kobo
  },
  (t) => [index("order_items_store_idx").on(t.storeId), index("order_items_order_idx").on(t.orderId)],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: id(),
    teamId: text("team_id").notNull().references(() => teams.id),
    userId: text("user_id").notNull().references(() => users.id),
    orderId: text("order_id").notNull().unique().references(() => orders.id),
    paid: boolean("paid").notNull().default(false),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("team_members_team_user").on(t.teamId, t.userId)],
);

// ---- Relations (for db.query.* with `with:`) ----
export const usersRelations = relations(users, ({ one, many }) => ({
  store: one(stores, { fields: [users.id], references: [stores.ownerId] }),
  orders: many(orders),
}));
export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, { fields: [stores.ownerId], references: [users.id] }),
  products: many(products),
}));
export const categoriesRelations = relations(categories, ({ many }) => ({ products: many(products) }));
export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  teams: many(teams),
}));
export const teamsRelations = relations(teams, ({ one, many }) => ({
  product: one(products, { fields: [teams.productId], references: [products.id] }),
  leader: one(users, { fields: [teams.leaderId], references: [users.id] }),
  members: many(teamMembers),
  orders: many(orders),
}));
export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
  order: one(orders, { fields: [teamMembers.orderId], references: [orders.id] }),
}));
export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, { fields: [orders.buyerId], references: [users.id] }),
  items: many(orderItems),
  team: one(teams, { fields: [orders.teamId], references: [teams.id] }),
  pickupPoint: one(pickupPoints, { fields: [orders.pickupPointId], references: [pickupPoints.id] }),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  store: one(stores, { fields: [orderItems.storeId], references: [stores.id] }),
}));

export type Product = typeof products.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type DeliveryRate = typeof deliveryRates.$inferSelect;
export type PickupPoint = typeof pickupPoints.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Team = typeof teams.$inferSelect;
