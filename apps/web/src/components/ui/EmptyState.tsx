import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { LegoStud } from "./LegoStud";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel relative overflow-hidden px-6 py-16 text-center lego-studs">
      <div className="absolute inset-x-8 top-10 grid grid-cols-8 gap-3 opacity-35" aria-hidden>
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="h-8 rounded-brick border-[3px] border-dashed border-black/30 bg-white/40"
          />
        ))}
      </div>
      <div className="relative">
        <div className="mb-3 flex justify-center gap-1.5">
          <LegoStud color="red" />
          <LegoStud color="yellow" bounce />
          <LegoStud color="blue" />
        </div>
        <div className="mx-auto mb-4 w-fit rounded-brick border-[3px] border-dashed border-black bg-white p-3 text-lego-ink shadow-brick">
          <Icon className="h-6 w-6 opacity-60" />
        </div>
        <h3 className="font-display text-2xl font-bold text-lego-ink">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-black/70">{description}</p>
        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-black/45">Unfinished build — add the first brick</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}
