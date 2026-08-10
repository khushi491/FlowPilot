"use client";

import { X } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface NodeTrace {
  id: string;
  node_id: string;
  node_type: string;
  status: string;
  input_data?: Record<string, unknown> | null;
  output_data?: Record<string, unknown> | null;
  logs?: Array<Record<string, unknown>>;
  error_message?: string | null;
  tokens_used?: number;
  estimated_cost_usd?: number;
  retry_count?: number;
  duration_ms?: number | null;
}

export function NodeTraceDrawer({
  node,
  onClose,
}: {
  node: NodeTrace | null;
  onClose: () => void;
}) {
  if (!node) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="font-semibold text-slate-900">Node trace</h3>
          <p className="text-xs text-slate-500">{node.node_id}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-2 hover:bg-slate-100" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-4 overflow-y-auto p-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={node.status} />
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
            {node.node_type}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Retries" value={String(node.retry_count ?? 0)} />
          <Metric label="Duration" value={node.duration_ms != null ? `${node.duration_ms} ms` : "—"} />
          <Metric label="Tokens" value={String(node.tokens_used ?? 0)} />
          <Metric label="Cost" value={`$${(node.estimated_cost_usd ?? 0).toFixed(4)}`} />
        </div>
        {node.error_message ? (
          <div className="rounded-lg bg-rose-50 p-3 text-rose-800">{node.error_message}</div>
        ) : null}
        <Section title="Input" value={node.input_data} />
        <Section title="Output" value={node.output_data} />
        <Section title="Logs" value={node.logs} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-900">{value}</div>
    </div>
  );
}

function Section({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <h4 className="mb-1 font-medium text-slate-800">{title}</h4>
      <pre className="max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-teal-100">
        {JSON.stringify(value ?? null, null, 2)}
      </pre>
    </div>
  );
}
