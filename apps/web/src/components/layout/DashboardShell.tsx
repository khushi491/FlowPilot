"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function DashboardShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_#d9f3ef_0%,_#f4f7f8_42%,_#eef2f4_100%)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 bg-white/70 px-4 py-5 pl-16 backdrop-blur md:px-6 md:pl-6">
          <div>
            <h1 className="font-display text-2xl text-slate-900">{title}</h1>
            {subtitle ? <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
