"use client";

import {
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  PlayCircle,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
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

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200/80 bg-[#0f1c24] text-slate-100">
      <div className="border-b border-white/10 px-5 py-6">
        <Link href="/dashboard" className="block">
          <div className="font-display text-2xl tracking-tight text-white">FlowPilot</div>
          <p className="mt-1 text-xs text-teal-200/80">AI workflow studio</p>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                active
                  ? "bg-teal-500/20 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-4 py-4">
        <p className="truncate px-1 text-xs text-slate-300">{user?.email}</p>
        <button
          type="button"
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
