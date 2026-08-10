import type { Metadata } from "next";
import { Suspense } from "react";
import { Fredoka, Nunito } from "next/font/google";
import { AuthProvider, RequireAuth } from "@/lib/auth";
import "./globals.css";

const display = Fredoka({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const body = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "FlowPilot — Brick-built AI Workflows",
  description: "Snap together LLM agent workflows with a Lego-inspired builder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <AuthProvider>
          <Suspense fallback={<div className="p-6 text-sm font-bold text-black/60">Loading bricks…</div>}>
            <RequireAuth>{children}</RequireAuth>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
