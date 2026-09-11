import type { Metadata } from "next";
import { getPublicEnv } from "@/lib/env/public";
import "./globals.css";

// Configuration is read from the runtime environment (ADR-025), so pages are rendered per
// request instead of being prerendered at build time with default values.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: getPublicEnv().NEXT_PUBLIC_APP_NAME,
    description: "Des leçons quotidiennes pour apprendre en jouant, en français.",
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={getPublicEnv().NEXT_PUBLIC_DEFAULT_LOCALE} className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
