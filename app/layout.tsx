import type { Metadata } from "next";
import { publicEnv } from "@/lib/env/public";
import "./globals.css";

export const metadata: Metadata = {
  title: publicEnv.NEXT_PUBLIC_APP_NAME,
  description: "Des leçons quotidiennes pour apprendre en jouant, en français.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={publicEnv.NEXT_PUBLIC_DEFAULT_LOCALE} className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
