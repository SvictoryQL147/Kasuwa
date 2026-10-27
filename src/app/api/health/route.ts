import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Deployment self-check. Shows which settings exist (never their values) and whether the DB is ready. */
export async function GET() {
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: (process.env.AUTH_SECRET?.length ?? 0) >= 16,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    PAYSTACK_MOCK: process.env.PAYSTACK_MOCK ?? null,
  };
  let database: Record<string, unknown>;
  try {
    const host = new URL(process.env.DATABASE_URL ?? "").hostname;
    const tables = await db.execute(sql`select count(*)::int as n from information_schema.tables where table_schema = 'public'`);
    const n = (tables.rows[0] as { n: number }).n;
    let products: number | null = null;
    if (n > 0) {
      const r = await db.execute(sql`select count(*)::int as n from products`);
      products = (r.rows[0] as { n: number }).n;
    }
    database = {
      host,
      connected: true,
      tables: n,
      products,
      hint: n === 0 ? "Connected, but no tables: run `npm run db:push` then `npm run db:seed` against this database."
        : products === 0 ? "Tables exist but no products: run `npm run db:seed`." : "OK",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    database = {
      connected: false,
      error: msg.replace(/postgres(ql)?:\/\/[^\s]+/g, "[url hidden]"),
      hint: !process.env.DATABASE_URL ? "DATABASE_URL is not set in Vercel → Settings → Environment Variables (then redeploy)."
        : /password authentication/i.test(msg) ? "Wrong password in DATABASE_URL. Copy it again from Neon → Connect."
        : /ENOTFOUND|ECONNREFUSED|Invalid URL/i.test(msg) ? "DATABASE_URL points to a host Vercel can't reach (localhost won't work). Use the Neon URL."
        : "Check DATABASE_URL ends with ?sslmode=require",
    };
  }
  const ok = env.DATABASE_URL && env.AUTH_SECRET && database.connected === true && database.hint === "OK";
  return NextResponse.json({ ok, env, database }, { status: ok ? 200 : 500 });
}
