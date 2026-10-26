"use client";
import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/app/account/actions";

type Field = { name: string; label: string; type?: string; placeholder?: string; autoComplete?: string };

export function AuthForm({
  action, fields, submit, next, footer,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  fields: Field[];
  submit: string;
  next?: string;
  footer: { text: string; href: string; link: string };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/"} />
      {fields.map((f) => (
        <label key={f.name} className="block">
          <span className="label">{f.label}</span>
          <input name={f.name} type={f.type ?? "text"} placeholder={f.placeholder} autoComplete={f.autoComplete} required className="input" />
        </label>
      ))}
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <button className="btn-primary w-full py-3" disabled={pending}>{pending ? "Please wait…" : submit}</button>
      <p className="text-center text-sm text-ink-500">
        {footer.text} <Link href={footer.href} className="font-semibold text-brand-700">{footer.link}</Link>
      </p>
    </form>
  );
}
