import { AuthForm } from "@/components/auth-form";
import { login } from "@/app/account/actions";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="container-x flex justify-center py-6 sm:py-12">
      <div className="card w-full max-w-md p-5 sm:p-6">
        <h1 className="mb-1 text-2xl font-bold">Welcome back</h1>
        <p className="mb-6 text-sm text-ink-500">Sign in with your email or phone number.</p>
        <AuthForm
          action={login}
          next={next}
          submit="Sign in"
          fields={[
            { name: "id", label: "Email or phone", placeholder: "0803 123 4567", autoComplete: "username" },
            { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
          ]}
          footer={{ text: "New here?", href: `/register${next ? `?next=${encodeURIComponent(next)}` : ""}`, link: "Create an account" }}
        />
        <p className="mt-6 rounded-lg bg-ink-100 p-3 text-xs text-ink-500">Demo: buyer@kasuwa.ng / password123 · seller@kasuwa.ng / password123</p>
      </div>
    </div>
  );
}
