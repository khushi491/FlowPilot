"use client";

import { RunSocketEvent } from "@/hooks/useRunSocket";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function RunTimeline({
  events,
  onSelectNode,
}: {
  events: RunSocketEvent[];
  onSelectNode?: (nodeId: string) => void;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">Waiting for live events…</p>;
  }

  return (
    <ol className="space-y-3">
      {events.map((event, index) => (
        <li key={`${event.type}-${index}`} className="relative pl-6">
          <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-teal-600" />
          {index < events.length - 1 ? (
            <span className="absolute left-[4px] top-4 h-full w-px bg-slate-200" />
          ) : null}
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {event.type}
              </span>
              {event.status ? <StatusBadge status={event.status} /> : null}
              {event.timestamp ? (
                <span className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
              ) : null}
            </div>
            {event.node_id ? (
              <button
                type="button"
                className="mt-1 text-sm font-medium text-teal-700 hover:underline"
                onClick={() => onSelectNode?.(event.node_id!)}
              >
                Node {event.node_id}
              </button>
            ) : null}
            {event.message ? <p className="mt-1 text-sm text-slate-600">{event.message}</p> : null}
            {event.error ? <p className="mt-1 text-sm text-rose-700">{event.error}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
