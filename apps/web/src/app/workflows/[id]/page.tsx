"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, Workflow } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function WorkflowDetailPage() {
  const params = useParams<{ id: string }>();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setWorkflow(await api.getWorkflow(params.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workflow");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const runWorkflow = async () => {
    if (!workflow) return;
    setRunning(true);
    try {
      const run = await api.createRun(workflow.id, {});
      window.location.href = `/runs?highlight=${run.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start run");
      setRunning(false);
    }
  };

  return (
    <DashboardShell
      title={workflow?.name || "Workflow"}
      subtitle="Inspect definition and launch a run. Visual editor arrives next."
      actions={
        <div className="flex gap-2">
          <Link href="/workflows" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <button type="button" className="btn-primary" onClick={runWorkflow} disabled={!workflow || running}>
            <Play className="h-4 w-4" />
            {running ? "Starting..." : "Run"}
          </button>
        </div>
      }
    >
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && workflow ? (
        <div className="space-y-4">
          <div className="panel p-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={workflow.status} />
              <span className="text-sm text-slate-500">Updated {formatDate(workflow.updated_at)}</span>
            </div>
            <p className="mt-3 text-slate-700">{workflow.description || "No description"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(workflow.tags || []).map((tag) => (
                <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="panel p-5">
            <h2 className="font-semibold text-slate-900">Workflow JSON</h2>
            <pre className="mt-3 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-teal-100">
              {JSON.stringify(workflow.definition, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
