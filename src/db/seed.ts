import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as schema from "./schema";
import { PRODUCT_PHOTOS } from "./product-photos";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
const N = (naira: number) => naira * 100; // naira -> kobo

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-");

const CATEGORIES = [
  { name: "Phones & Tablets", slug: "phones", icon: "Smartphone" },
  { name: "Fashion", slug: "fashion", icon: "Shirt" },
  { name: "Home & Kitchen", slug: "home", icon: "CookingPot" },
  { name: "Beauty & Care", slug: "beauty", icon: "Sparkles" },
  { name: "Electronics", slug: "electronics", icon: "Tv" },
  { name: "Groceries", slug: "groceries", icon: "ShoppingBasket" },
  { name: "Baby & Kids", slug: "baby", icon: "Baby" },
  { name: "Computing", slug: "computing", icon: "Laptop" },
];

// Express hubs = same/next-day delivery. Fees in naira.
const METRO: Record<string, number> = { Lagos: 1500, FCT: 1800, Rivers: 2000, Enugu: 1800, Oyo: 1800 };
const NEAR = ["Ogun", "Anambra", "Abia", "Imo", "Edo", "Delta", "Kaduna", "Kano", "Kwara", "Osun", "Ondo", "Ekiti",
  "Nasarawa", "Niger", "Akwa Ibom", "Cross River", "Ebonyi", "Plateau"];
const STATES = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River",
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara"];

const PICKUPS = [
  { name: "Kasuwa Hub Yaba", address: "12 Herbert Macaulay Way, Yaba", city: "Yaba", state: "Lagos", fee: 500 },
  { name: "Kasuwa Hub Lekki", address: "Admiralty Way, Lekki Phase 1", city: "Lekki", state: "Lagos", fee: 500 },
  { name: "Kasuwa Hub Ikeja", address: "Allen Avenue, Ikeja", city: "Ikeja", state: "Lagos", fee: 500 },
  { name: "Kasuwa Hub Wuse", address: "Aminu Kano Crescent, Wuse 2", city: "Wuse", state: "FCT", fee: 600 },
  { name: "Kasuwa Hub New Haven", address: "Chime Avenue, New Haven", city: "Enugu", state: "Enugu", fee: 500 },
  { name: "Kasuwa Hub GRA", address: "Aba Road, GRA Phase 2", city: "Port Harcourt", state: "Rivers", fee: 600 },
  { name: "Kasuwa Hub Bodija", address: "Bodija Market Road", city: "Ibadan", state: "Oyo", fee: 500 },
];

const STORES = [
  { key: "ikeja-gadget-plug", name: "Ikeja Gadget Plug", state: "Lagos", city: "Ikeja", verified: true, rating: 4.8,
    description: "Original phones, laptops and accessories from Computer Village. 7-day return guarantee." },
  { key: "aba-made", name: "Aba Made Clothing Co.", state: "Abia", city: "Aba", verified: true, rating: 4.7,
    description: "Made-in-Aba shoes, bags and ready-to-wear. Proudly Nigerian craftsmanship." },
  { key: "wuse-home", name: "Wuse Home Essentials", state: "FCT", city: "Wuse", verified: true, rating: 4.6,
    description: "Kitchenware, appliances and home décor delivered across Abuja same day." },
  { key: "coal-city-glow", name: "Coal City Glow", state: "Enugu", city: "Enugu", verified: false, rating: 4.5,
    description: "Natural skincare: shea butter, black soap and oils sourced from local producers." },
  { key: "kantin-kwari", name: "Kantin Kwari Traders", state: "Kano", city: "Kano", verified: true, rating: 4.4,
    description: "Wholesale fabrics, groceries and household staples from Kano's biggest markets." },
];

type P = {
  store: string; cat: string; title: string; price: number; was?: number; team?: [number, number];
  stock: number; express?: boolean; rating: number; reviews: number; sold: number; tags: string[]; desc: string;
};

const PRODUCTS: P[] = [
  { store: "ikeja-gadget-plug", cat: "phones", title: "Tecno Spark 30 Pro 8GB/256GB", price: 239000, was: 275000, team: [219000, 3], stock: 40, express: true, rating: 4.6, reviews: 312, sold: 1480, tags: ["tecno", "android", "phone", "smartphone"], desc: "6.78\" AMOLED, 108MP camera, 5000mAh battery with 33W fast charging. Official Nigerian warranty." },
  { store: "ikeja-gadget-plug", cat: "phones", title: "Infinix Hot 50 4GB/128GB", price: 159000, was: 180000, team: [145000, 3], stock: 60, express: true, rating: 4.5, reviews: 528, sold: 2210, tags: ["infinix", "android", "phone", "budget"], desc: "Slim 7.8mm design, 120Hz display, 5000mAh battery. Perfect first smartphone." },
  { store: "ikeja-gadget-plug", cat: "phones", title: "Samsung Galaxy A16 6GB/128GB", price: 245000, was: 265000, stock: 25, express: true, rating: 4.7, reviews: 189, sold: 640, tags: ["samsung", "android", "phone"], desc: "6 years of Android updates, Super AMOLED, 50MP triple camera." },
  { store: "ikeja-gadget-plug", cat: "electronics", title: "Oraimo FreePods 4 Wireless Earbuds", price: 24500, was: 32000, team: [19900, 2], stock: 200, express: true, rating: 4.6, reviews: 2104, sold: 9800, tags: ["oraimo", "earbuds", "audio", "bluetooth"], desc: "Active noise cancellation, 35hrs playtime, deep bass. Sweat resistant." },
  { store: "ikeja-gadget-plug", cat: "electronics", title: "Oraimo 20000mAh Power Bank", price: 21000, was: 26000, team: [17500, 3], stock: 150, express: true, rating: 4.7, reviews: 3320, sold: 15200, tags: ["power bank", "oraimo", "nepa", "charging", "light"], desc: "Survive NEPA wahala. Charges a phone 4–5 times, 22.5W fast charge, LED display." },
  { store: "ikeja-gadget-plug", cat: "computing", title: "HP 250 G9 Core i5 8GB/512GB SSD", price: 685000, was: 750000, stock: 12, express: true, rating: 4.5, reviews: 77, sold: 210, tags: ["laptop", "hp", "work", "student"], desc: "12th Gen Intel Core i5, 15.6\" FHD, Windows 11. Great for work and school." },
  { store: "ikeja-gadget-plug", cat: "computing", title: "Logitech M190 Wireless Mouse", price: 12500, stock: 80, express: true, rating: 4.6, reviews: 410, sold: 1900, tags: ["mouse", "logitech", "computer"], desc: "Full-size comfort, 18-month battery life, plug-and-play USB receiver." },
  { store: "aba-made", cat: "fashion", title: "Handmade Leather Men's Loafers", price: 28000, was: 38000, team: [22500, 3], stock: 70, rating: 4.7, reviews: 640, sold: 3100, tags: ["shoes", "men", "leather", "aba", "made in nigeria"], desc: "Genuine leather, hand-stitched in Aba. Sizes 40–46. Comfortable for all-day wear." },
  { store: "aba-made", cat: "fashion", title: "Ankara Print Bucket Hat", price: 6500, team: [4800, 4], stock: 300, rating: 4.4, reviews: 220, sold: 1400, tags: ["ankara", "hat", "unisex", "made in nigeria"], desc: "Reversible ankara bucket hat. One size fits most." },
  { store: "aba-made", cat: "fashion", title: "Women's Ankara Wrap Dress", price: 18500, was: 24000, team: [15000, 3], stock: 90, rating: 4.6, reviews: 380, sold: 1750, tags: ["ankara", "dress", "women", "owambe"], desc: "Flattering wrap silhouette in 100% cotton wax print. Owambe ready. Sizes 8–18." },
  { store: "aba-made", cat: "fashion", title: "Leather Crossbody Bag", price: 22000, stock: 45, rating: 4.5, reviews: 96, sold: 380, tags: ["bag", "women", "leather"], desc: "Compact, durable and stylish. Adjustable strap, two inner pockets." },
  { store: "wuse-home", cat: "home", title: "Binatone 1.7L Electric Kettle", price: 16500, was: 19500, team: [13900, 3], stock: 120, express: true, rating: 4.5, reviews: 870, sold: 4300, tags: ["kettle", "kitchen", "binatone"], desc: "Stainless steel, auto shut-off, boils in under 4 minutes." },
  { store: "wuse-home", cat: "home", title: "Scanfrost 5-Speed Blender 1.5L", price: 42000, was: 49000, team: [36500, 3], stock: 50, express: true, rating: 4.6, reviews: 455, sold: 1880, tags: ["blender", "kitchen", "pepper", "smoothie"], desc: "Grinds pepper, beans for akara and smoothies. Includes dry mill." },
  { store: "wuse-home", cat: "home", title: "Non-stick Pot Set (5 pieces)", price: 38000, was: 52000, team: [31000, 4], stock: 60, express: true, rating: 4.4, reviews: 302, sold: 1210, tags: ["pots", "cookware", "kitchen"], desc: "Granite coating, glass lids, works on gas and electric cookers." },
  { store: "wuse-home", cat: "electronics", title: "Rechargeable LED Standing Fan 16\"", price: 58000, was: 69000, team: [51000, 3], stock: 35, express: true, rating: 4.5, reviews: 640, sold: 2600, tags: ["fan", "rechargeable", "nepa", "solar"], desc: "Runs 8–12 hours on battery, built-in LED light, solar-ready input." },
  { store: "wuse-home", cat: "electronics", title: "Hisense 43\" Smart TV", price: 349000, was: 399000, stock: 15, express: true, rating: 4.6, reviews: 210, sold: 520, tags: ["tv", "smart tv", "hisense", "netflix"], desc: "Full HD, Netflix and YouTube built in, 2 HDMI ports." },
  { store: "coal-city-glow", cat: "beauty", title: "Raw Shea Butter 500g", price: 4500, team: [3200, 4], stock: 400, rating: 4.8, reviews: 1290, sold: 7600, tags: ["shea butter", "skincare", "natural", "ori"], desc: "Unrefined Grade A shea butter. Moisturises skin and hair." },
  { store: "coal-city-glow", cat: "beauty", title: "African Black Soap (3 pack)", price: 5200, was: 6500, team: [3900, 3], stock: 350, rating: 4.7, reviews: 840, sold: 5100, tags: ["black soap", "dudu osun", "skincare"], desc: "Traditional black soap for clear, glowing skin. Handmade." },
  { store: "coal-city-glow", cat: "beauty", title: "Hair Growth Oil with Chebe 100ml", price: 7800, stock: 200, rating: 4.4, reviews: 410, sold: 2300, tags: ["hair oil", "chebe", "natural hair"], desc: "Chebe, rosemary and castor oil blend for stronger edges." },
  { store: "kantin-kwari", cat: "groceries", title: "Mama Gold Rice 25kg", price: 68000, was: 75000, team: [61500, 5], stock: 100, rating: 4.6, reviews: 960, sold: 4800, tags: ["rice", "food", "bag of rice", "foodstuff"], desc: "Premium parboiled long-grain rice. Stone-free." },
  { store: "kantin-kwari", cat: "groceries", title: "Kings Vegetable Oil 5L", price: 19500, team: [17200, 4], stock: 140, rating: 4.5, reviews: 520, sold: 3300, tags: ["oil", "cooking oil", "foodstuff"], desc: "Cholesterol-free vegetable oil for everyday cooking." },
  { store: "kantin-kwari", cat: "groceries", title: "Honeywell Semovita 10kg", price: 16800, team: [14900, 4], stock: 160, rating: 4.6, reviews: 430, sold: 2900, tags: ["semovita", "swallow", "foodstuff"], desc: "Smooth, lump-free semolina for your favourite soups." },
  { store: "kantin-kwari", cat: "fashion", title: "Swiss Voile Lace Fabric (5 yards)", price: 45000, was: 55000, team: [38000, 3], stock: 40, rating: 4.7, reviews: 150, sold: 600, tags: ["lace", "fabric", "aso ebi", "owambe"], desc: "Premium swiss voile, perfect for aso-ebi. Multiple colours." },
  { store: "kantin-kwari", cat: "baby", title: "Molfix Diapers Size 4 (Jumbo 68)", price: 15500, team: [13200, 4], stock: 220, rating: 4.6, reviews: 770, sold: 5400, tags: ["diapers", "baby", "molfix"], desc: "12-hour dryness, soft and breathable. 7–14kg." },
];

async function main() {
  console.log("Seeding Kasuwa…");
  await db.execute(sql`truncate table team_members, order_items, orders, teams, products, stores, users,
    categories, delivery_rates, pickup_points restart identity cascade`);

  const cats = await db.insert(schema.categories)
    .values(CATEGORIES.map((c, i) => ({ ...c, sort: i }))).returning();
  const catId = new Map(cats.map((c) => [c.slug, c.id]));

  await db.insert(schema.deliveryRates).values(
    STATES.map((state) => {
      const metro = METRO[state];
      const near = NEAR.includes(state);
      return {
        state,
        standardFee: N(metro ? 1200 : near ? 2500 : 3500),
        standardMinDays: metro ? 1 : near ? 2 : 3,
        standardMaxDays: metro ? 3 : near ? 5 : 7,
        expressAvailable: !!metro,
        expressFee: metro ? N(metro) : null,
        podAvailable: !!metro || near,
      };
    }),
  );

  await db.insert(schema.pickupPoints).values(
    PICKUPS.map((p) => ({ ...p, fee: N(p.fee), hours: "Mon–Sat, 8am–8pm" })),
  );

  const pw = await bcrypt.hash("password123", 10);
  await db.insert(schema.users).values({
    name: "Ada Okafor", email: "buyer@kasuwa.ng", phone: "2348030000001", passwordHash: pw,
  });

  const storeInfo = new Map<string, { id: string; state: string }>();
  for (const [i, s] of STORES.entries()) {
    const [user] = await db.insert(schema.users).values({
      name: `${s.name} Owner`,
      email: i === 0 ? "seller@kasuwa.ng" : `${s.key}@kasuwa.ng`,
      phone: `23481000000${10 + i}`,
      passwordHash: pw,
      role: "SELLER",
    }).returning();
    const [store] = await db.insert(schema.stores).values({
      ownerId: user.id, name: s.name, slug: s.key, description: s.description,
      state: s.state, city: s.city, verified: s.verified, rating: s.rating,
    }).returning();
    storeInfo.set(s.key, { id: store.id, state: s.state });
  }

  await db.insert(schema.products).values(
    PRODUCTS.map((p) => {
      const store = storeInfo.get(p.store)!;
      return {
        storeId: store.id,
        categoryId: catId.get(p.cat)!,
        title: p.title,
        slug: slugify(p.title),
        description: p.desc,
        images: PRODUCT_PHOTOS[slugify(p.title)] ?? [],
        tags: p.tags,
        price: N(p.price),
        compareAtPrice: p.was ? N(p.was) : null,
        teamPrice: p.team ? N(p.team[0]) : null,
        teamSize: p.team ? p.team[1] : null,
        stock: p.stock,
        shipsFromState: store.state,
        expressEligible: !!p.express,
        rating: p.rating,
        ratingCount: p.reviews,
        soldCount: p.sold,
      };
    }),
  );

  console.log(`Done: ${CATEGORIES.length} categories, ${STORES.length} stores, ${PRODUCTS.length} products.`);
  console.log("Demo logins (password: password123): buyer@kasuwa.ng, seller@kasuwa.ng");
}

main().finally(() => pool.end());
