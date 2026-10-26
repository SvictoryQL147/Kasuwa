"use server";
import { eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { normalisePhone } from "@/lib/nigeria";

export type FormState = { error?: string } | undefined;

const safeNext = (n: FormDataEntryValue | null) => {
  const s = typeof n === "string" ? n : "/";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
};

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().transform((v, ctx) => {
    const p = normalisePhone(v);
    if (!p) ctx.addIssue({ code: "custom", message: "Enter a valid Nigerian phone number" });
    return p ?? "";
  }),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, phone, password } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: or(eq(schema.users.email, email), eq(schema.users.phone, phone)),
  });
  if (existing) return { error: "An account with that email or phone already exists. Sign in instead." };

  const [user] = await db
    .insert(schema.users)
    .values({ name, email, phone, passwordHash: await hashPassword(password) })
    .returning();
  await createSession({ userId: user.id, role: user.role, name: user.name });
  redirect(safeNext(form.get("next")));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const id = String(form.get("id") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const phone = normalisePhone(id);
  const user = await db.query.users.findFirst({
    where: phone ? eq(schema.users.phone, phone) : eq(schema.users.email, id),
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Wrong email/phone or password" };
  }
  await createSession({ userId: user.id, role: user.role, name: user.name });
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
