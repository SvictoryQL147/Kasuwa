"use client";
import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

export function ShareTeam({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
        target="_blank"
        rel="noreferrer"
        className="btn flex-1 bg-[#25D366] py-3 text-base text-white hover:brightness-95"
      >
        <MessageCircle className="h-5 w-5" /> Share on WhatsApp
      </a>
      <button
        type="button"
        className="btn-ghost py-3"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
