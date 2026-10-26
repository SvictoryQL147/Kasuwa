"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Users, X, Zap } from "lucide-react";
import { naira } from "@/lib/money";
import { ProductImage } from "./product-image";
import { SITE } from "@/lib/site";
import { OPEN_ASSISTANT_EVENT } from "./bottom-nav";

type Msg = { role: "user" | "assistant"; content: string; products?: AssistantProduct[] };
type AssistantProduct = {
  id: string; slug: string; title: string; price: number; teamPrice: number | null; teamSize: number | null;
  rating: number; expressEligible: boolean; categorySlug: string; images: string[];
};

const SUGGESTIONS = [
  "Phone with big battery under 200k",
  "Abeg, I need power bank wey go last",
  "Mo fẹ́ ra aṣọ ankara",
  "Ina son shinkafa buhu daya",
];

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Tell me what you're looking for. You can write in English, Pidgin, Yoruba, Igbo or Hausa." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);
  useEffect(() => {
    const openIfHash = () => { if (location.hash === "#ask") setOpen(true); };
    const openNow = () => setOpen(true);
    openIfHash();
    window.addEventListener("hashchange", openIfHash);
    window.addEventListener(OPEN_ASSISTANT_EVENT, openNow);
    return () => {
      window.removeEventListener("hashchange", openIfHash);
      window.removeEventListener(OPEN_ASSISTANT_EVENT, openNow);
    };
  }, []);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text.trim() }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(1).map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, res.ok ? { role: "assistant", content: data.reply, products: data.products } : { role: "assistant", content: data.error ?? "Something went wrong." }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Network wahala. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 hidden items-center gap-2 rounded-full md:flex bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg hover:bg-brand-700"
      >
        <Bot className="h-5 w-5" /> Ask {SITE.name}
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl ring-1 ring-black/10 md:inset-x-auto md:bottom-4 md:right-4 md:h-auto md:max-h-[80vh] md:w-96 md:rounded-2xl md:pb-0">
      <div className="flex items-center justify-between bg-brand-700 px-4 py-3 text-white">
        <p className="flex items-center gap-2 font-semibold"><Bot className="h-5 w-5" /> Shopping assistant</p>
        <button onClick={() => { setOpen(false); if (location.hash === "#ask") history.replaceState(null, "", location.pathname + location.search); }} aria-label="Close" className="-m-2 p-2"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-ink-100 p-3 text-sm">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={m.role === "user" ? "max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3 py-2 text-white" : "max-w-[95%] space-y-2"}>
              {m.role === "assistant" ? <p className="rounded-2xl rounded-bl-sm bg-white px-3 py-2 shadow-sm">{m.content}</p> : m.content}
              {m.products?.map((p) => (
                <Link key={p.id} href={`/p/${p.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl bg-white p-2 shadow-sm hover:ring-1 hover:ring-brand-500">
                  <ProductImage src={p.images[0]} alt={p.title} category={p.categorySlug} className="h-12 w-12 shrink-0 rounded-lg" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.title}</p>
                    <p className="text-xs">
                      <span className="font-bold">{naira(p.price)}</span>
                      {p.teamPrice && <span className="ml-2 inline-flex items-center gap-0.5 text-accent-600"><Users className="h-3 w-3" />{naira(p.teamPrice)}</span>}
                      {p.expressEligible && <Zap className="ml-1 inline h-3 w-3 text-brand-600" />}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
        {msgs.length === 1 && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full bg-white px-3 py-2 text-xs ring-1 ring-ink-300 hover:ring-brand-500">{s}</button>
            ))}
          </div>
        )}
        {busy && <p className="animate-pulse text-ink-500">Searching…</p>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t p-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Wetin you dey find?" className="input" aria-label="Message" />
        <button className="btn-primary px-3" disabled={busy || !input.trim()} aria-label="Send"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}
