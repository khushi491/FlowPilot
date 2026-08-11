"use client";

import { useState } from "react";
import {
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  PlayCircle,
  Workflow,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { LegoStud } from "@/components/ui/LegoStud";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/runs", label: "Runs", icon: PlayCircle },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const nav = (
    <>
      <div className="border-b-[3px] border-black px-5 py-6">
        <Link href="/dashboard" className="block" onClick={() => setOpen(false)}>
          <div className="flex items-center gap-2">
            <LegoStud color="yellow" className="h-5 w-5" />
            <div className="font-display text-2xl font-bold tracking-tight text-white">FlowPilot</div>
          </div>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-lego-yellow">Brick studio</p>
        </Link>
      </div>
      <nav className="flex-1 space-y-2 px-3 py-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-brick border-[3px] px-3 py-2.5 text-sm font-bold uppercase tracking-wide transition",
                active
                  ? "border-black bg-lego-yellow text-lego-ink shadow-brick-yellow"
                  : "border-transparent text-white hover:border-white/40 hover:bg-white/10"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t-[3px] border-black px-4 py-4">
        <p className="truncate px-1 text-xs font-semibold text-white/80">{user?.email}</p>
        <button
          type="button"
          className="mt-2 flex w-full items-center gap-2 rounded-brick border-[3px] border-black bg-lego-red px-2 py-2 text-sm font-bold uppercase text-white shadow-brick-red"
          onClick={() => {
            void logout().finally(() => router.replace("/login"));
          }}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-brick border-[3px] border-black bg-lego-yellow p-2 shadow-brick-yellow md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r-[4px] border-black lego-studs-blue text-white transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <button
          type="button"
          className="absolute right-3 top-3 rounded-md border-2 border-black bg-lego-yellow p-1 text-black md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
        {nav}
      </aside>
    </>
  );
}
