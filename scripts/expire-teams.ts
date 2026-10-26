// Run manually or from a cron: npm run jobs:expire-teams
// (In production, prefer Vercel Cron → /api/cron/expire-teams.)
import { expireTeams } from "../src/lib/orders";

expireTeams().then((r) => { console.log(r); process.exit(0); });
