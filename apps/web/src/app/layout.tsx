import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AuthProvider, RequireAuth } from "@/lib/auth";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "FlowPilot — Visual AI Workflow Builder",
  description: "Create, run, and monitor LLM-powered automation workflows.",
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
          <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading…</div>}>
            <RequireAuth>{children}</RequireAuth>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
