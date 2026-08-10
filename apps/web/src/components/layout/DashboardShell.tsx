"use client";

import { ReactNode } from "react";
import { BrickRow } from "@/components/ui/LegoStud";
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
    <div className="flex min-h-screen lego-studs">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-[4px] border-black bg-lego-yellow px-4 py-5 pl-16 md:px-6 md:pl-6">
          <div>
            <BrickRow className="mb-2" />
            <h1 className="font-display text-3xl font-bold text-lego-ink">{title}</h1>
            {subtitle ? <p className="mt-1 max-w-2xl text-sm font-semibold text-black/70">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
