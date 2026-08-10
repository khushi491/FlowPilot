import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  draft: "bg-white text-lego-ink",
  active: "bg-lego-green text-white",
  paused: "bg-lego-orange text-white",
  failed: "bg-lego-red text-white",
  queued: "bg-lego-blue text-white",
  running: "bg-lego-yellow text-lego-ink",
  completed: "bg-lego-green text-white",
  pending: "bg-white text-lego-ink",
  skipped: "bg-white text-black/60",
  waiting_approval: "bg-lego-orange text-white",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "brick-chip capitalize",
        styles[status] || "bg-white text-lego-ink"
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
