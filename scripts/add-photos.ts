// Adds the demo photos to an already-seeded database without wiping orders or users.
// Usage: npm run db:photos
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { PRODUCT_PHOTOS } from "../src/db/product-photos";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

(async () => {
  let n = 0;
  for (const [slug, images] of Object.entries(PRODUCT_PHOTOS)) {
    const r = await db.update(schema.products).set({ images }).where(eq(schema.products.slug, slug)).returning({ id: schema.products.id });
    n += r.length;
  }
  console.log(`Added photos to ${n} products.`);
  await pool.end();
})();
