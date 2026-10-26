import { defineConfig } from "drizzle-kit";

// Load .env so `npm run db:push` works on Windows/macOS/Linux without extra tools.
try {
  process.loadEnvFile();
} catch {
  /* no .env file: rely on real environment variables */
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
