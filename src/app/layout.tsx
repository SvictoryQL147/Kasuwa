import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Assistant } from "@/components/assistant";
import { BottomNav } from "@/components/bottom-nav";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, locale: "en_NG", type: "website" },
};

export const viewport: Viewport = { themeColor: "#027a48", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en-NG">
      <body className="min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))] font-sans md:pb-0">
        <Header />
        <main>{children}</main>
        <Footer />
        <Assistant />
        <BottomNav signedIn={!!session} />
      </body>
    </html>
  );
}
