"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, WorkflowRun } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function RunsPage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const load = async (nextOffset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const page = await api.listRuns({
        status: status || undefined,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });
      setRuns(page.items);
      setTotal(page.total);
      setOffset(page.offset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load runs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const summary = useMemo(() => {
    const totalTokens = runs.reduce((sum, run) => sum + run.total_tokens, 0);
    const totalCost = runs.reduce((sum, run) => sum + run.estimated_cost_usd, 0);
    const failed = runs.filter((run) => run.status === "failed").length;
    const avgDuration =
      runs.filter((run) => run.duration_ms != null).reduce((sum, run) => sum + (run.duration_ms || 0), 0) /
      Math.max(1, runs.filter((run) => run.duration_ms != null).length);
    return { totalTokens, totalCost, failed, avgDuration: Math.round(avgDuration || 0) };
  }, [runs]);

  return (
    <DashboardShell
      title="Observability"
      subtitle="Run history with tokens, cost, retries, duration, and error messages."
      actions={
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="queued">Queued</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="paused">Paused</option>
        </select>
      }
    >
      {loading ? <LoadingState label="Loading runs..." /> : null}
      {error ? <ErrorState message={error} onRetry={() => void load(offset)} /> : null}
      {!loading && !error ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <SummaryCard label="Runs" value={String(total)} />
          <SummaryCard label="Tokens (page)" value={String(summary.totalTokens)} />
          <SummaryCard label="Est. cost (page)" value={`$${summary.totalCost.toFixed(4)}`} />
          <SummaryCard label="Failed (page)" value={String(summary.failed)} />
        </div>
      ) : null}
      {!loading && !error && runs.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title="No runs yet"
          description="Launch a workflow from the workflows page to see execution history here."
        />
      ) : null}
      {!loading && !error && runs.length > 0 ? (
        <div>
          <div className="panel overflow-hidden">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Run</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Tokens</th>
                  <th className="px-4 py-3 font-medium">Cost</th>
                  <th className="px-4 py-3 font-medium">Retries</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Error</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-t border-slate-100 hover:bg-teal-50/40">
                    <td className="px-4 py-3">
                      <Link href={`/runs/${run.id}`} className="font-mono text-xs text-teal-700 hover:underline">
                        {run.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="px-4 py-3">{run.total_tokens}</td>
                    <td className="px-4 py-3">${run.estimated_cost_usd.toFixed(4)}</td>
                    <td className="px-4 py-3">{run.retry_count}</td>
                    <td className="px-4 py-3">{run.duration_ms != null ? `${run.duration_ms} ms` : "—"}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-rose-700" title={run.error_message || ""}>
                      {run.error_message || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(run.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              Avg duration (page): {summary.avgDuration || 0} ms
            </p>
          </div>
          <PaginationControls
            total={total}
            limit={PAGE_SIZE}
            offset={offset}
            onChange={(next) => void load(next)}
          />
        </div>
      ) : null}
    </DashboardShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl text-slate-900">{value}</p>
    </div>
  );
}
