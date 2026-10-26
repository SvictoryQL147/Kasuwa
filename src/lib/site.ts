// Change the brand in one place.
export const SITE = {
  name: "Kasuwa",
  tagline: "Shop smarter, together.",
  description:
    "Nigeria's marketplace for verified sellers, Team-Up group deals, same-day delivery in major cities and an AI shopping assistant that speaks your language.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supportWhatsApp: "2348000000000",
};

export const TEAM_DURATION_HOURS = 24;
export const POD_MAX_ORDER_KOBO = 150_000_00; // pay on delivery capped at ₦150,000
export const FREE_DELIVERY_THRESHOLD_KOBO = 50_000_00; // free standard delivery over ₦50,000 in metro states
export const COMMISSION_BPS = Number(process.env.PLATFORM_COMMISSION_BPS ?? 1000);
