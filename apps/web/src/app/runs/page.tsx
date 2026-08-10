"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, WorkflowRun } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function RunsPage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRuns(await api.listRuns(status ? { status } : undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load runs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // Reload whenever the status filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <DashboardShell
      title="Runs"
      subtitle="Track execution history, status, tokens, and estimated cost."
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
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && runs.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title="No runs yet"
          description="Launch a workflow from the workflows page to see execution history here."
        />
      ) : null}
      {!loading && !error && runs.length > 0 ? (
        <div className="panel overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Run</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Tokens</th>
                <th className="px-4 py-3 font-medium">Cost</th>
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
                  <td className="px-4 py-3 text-slate-600">{formatDate(run.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </DashboardShell>
  );
}
