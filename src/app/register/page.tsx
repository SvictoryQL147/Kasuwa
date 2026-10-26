import { AuthForm } from "@/components/auth-form";
import { register } from "@/app/account/actions";

export const metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="container-x flex justify-center py-6 sm:py-12">
      <div className="card w-full max-w-md p-5 sm:p-6">
        <h1 className="mb-1 text-2xl font-bold">Create your account</h1>
        <p className="mb-6 text-sm text-ink-500">Takes 30 seconds. We&apos;ll send order updates to your phone.</p>
        <AuthForm
          action={register}
          next={next}
          submit="Create account"
          fields={[
            { name: "name", label: "Full name", autoComplete: "name" },
            { name: "phone", label: "Phone number", type: "tel", placeholder: "0803 123 4567", autoComplete: "tel" },
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
          ]}
          footer={{ text: "Already have an account?", href: `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`, link: "Sign in" }}
        />
      </div>
    </div>
  );
}
