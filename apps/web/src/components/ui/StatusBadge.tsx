import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-800",
  paused: "bg-amber-100 text-amber-800",
  failed: "bg-rose-100 text-rose-800",
  queued: "bg-sky-100 text-sky-800",
  running: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        styles[status] || "bg-slate-100 text-slate-700"
      )}
    >
      {status}
    </span>
  );
}
