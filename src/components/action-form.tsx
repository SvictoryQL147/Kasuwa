"use client";
import { useActionState } from "react";

type State = { error?: string } | undefined;

/** Thin wrapper so server components can render forms with error + pending state. */
export function ActionForm({
  action, children, submit, className,
}: {
  action: (s: State, f: FormData) => Promise<State>;
  children: React.ReactNode;
  submit: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <button className="btn-primary w-full py-3" disabled={pending}>{pending ? "Saving…" : submit}</button>
    </form>
  );
}
