import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container-x py-20 text-center">
      <h1 className="text-3xl font-bold">Page no dey here</h1>
      <p className="mt-2 text-ink-500">The page you&apos;re looking for has moved or doesn&apos;t exist.</p>
      <Link href="/" className="btn-primary mt-6">Back to shopping</Link>
    </div>
  );
}
