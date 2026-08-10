import { cn } from "@/lib/utils";

export function LegoStud({
  color = "yellow",
  className,
  bounce,
}: {
  color?: "red" | "yellow" | "blue" | "green" | "orange";
  className?: string;
  bounce?: boolean;
}) {
  const fills: Record<string, string> = {
    red: "bg-lego-red",
    yellow: "bg-lego-yellow",
    blue: "bg-lego-blue",
    green: "bg-lego-green",
    orange: "bg-lego-orange",
  };

  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-4 w-4 rounded-full border-2 border-black",
        fills[color],
        bounce && "animate-stud-bounce",
        className
      )}
      style={{ boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.18), inset 0 2px 0 rgba(255,255,255,0.35)" }}
    />
  );
}

export function BrickRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)} aria-hidden>
      <LegoStud color="red" />
      <LegoStud color="yellow" bounce />
      <LegoStud color="blue" />
      <LegoStud color="green" />
      <LegoStud color="orange" />
    </div>
  );
}
