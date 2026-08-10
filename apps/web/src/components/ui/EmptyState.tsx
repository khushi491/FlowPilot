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
    <div className="panel flex flex-col items-center justify-center bg-lego-yellow/40 px-6 py-16 text-center">
      <div className="mb-3 flex gap-1.5">
        <LegoStud color="red" />
        <LegoStud color="blue" />
        <LegoStud color="green" />
      </div>
      <div className="mb-4 rounded-brick border-[3px] border-black bg-white p-3 text-lego-ink shadow-brick">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-display text-2xl font-bold text-lego-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm font-semibold text-black/70">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
