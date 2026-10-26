import { NextResponse } from "next/server";
import { expireTeams } from "@/lib/orders";

/** Called by Vercel Cron (see vercel.json). Protected with CRON_SECRET. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ...(await expireTeams()) });
}
