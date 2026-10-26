import { redirect } from "next/navigation";
import { BadgeCheck, Users, Wallet, Zap } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { requireUser } from "@/lib/auth";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { COMMISSION_BPS, SITE } from "@/lib/site";
import { createStore } from "../seller/actions";

export const metadata = { title: "Sell" };

export default async function SellPage() {
  const user = await requireUser("/sell");
  if (user.store) redirect("/seller");

  return (
    <div className="container-x grid gap-6 py-6 md:grid-cols-2 md:gap-8 md:py-10">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Sell to all of Nigeria on {SITE.name}</h1>
        <p className="mt-2 text-ink-700">Free to join. You only pay {COMMISSION_BPS / 100}% when you make a sale.</p>
        <ul className="mt-6 space-y-4">
          {[
            { i: Users, t: "Team-Up sells in bulk", d: "Shoppers recruit their friends for you on WhatsApp. One listing, many orders." },
            { i: Zap, t: "We handle delivery", d: "Express in 5 cities and nationwide standard delivery with pickup points." },
            { i: Wallet, t: "Get paid fast", d: "Payouts to any Nigerian bank account after delivery is confirmed." },
            { i: BadgeCheck, t: "Get verified", d: "Verified sellers get a badge and rank higher in search." },
          ].map(({ i: I, t, d }) => (
            <li key={t} className="flex gap-3">
              <I className="h-6 w-6 shrink-0 text-brand-600" />
              <div><p className="font-semibold">{t}</p><p className="text-sm text-ink-500">{d}</p></div>
            </li>
          ))}
        </ul>
      </div>
      <div className="card p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-bold">Open your store</h2>
        <ActionForm action={createStore} submit="Create my store" className="space-y-3">
          <label className="block"><span className="label">Store name</span><input name="name" className="input" required /></label>
          <label className="block"><span className="label">What do you sell?</span><textarea name="description" rows={2} className="input" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label><span className="label">State</span>
              <select name="state" className="input" defaultValue="Lagos">{NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select>
            </label>
            <label><span className="label">City</span><input name="city" className="input" required /></label>
          </div>
          <p className="pt-2 text-sm font-semibold">Payout account</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label><span className="label">Bank</span><input name="bankName" placeholder="e.g. GTBank" className="input" required /></label>
            <label><span className="label">Account number</span><input name="accountNumber" inputMode="numeric" maxLength={10} className="input" required /></label>
          </div>
          <label className="block"><span className="label">Account name</span><input name="accountName" className="input" required /></label>
        </ActionForm>
      </div>
    </div>
  );
}
