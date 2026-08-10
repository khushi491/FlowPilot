"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { WorkflowEditor } from "@/components/workflow/WorkflowEditor";
import { api, Workflow } from "@/lib/api";

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
      title={workflow?.name || "Workflow builder"}
      subtitle="Drag nodes, connect edges, configure, and save a validated workflow graph."
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
        <WorkflowEditor workflow={workflow} onSaved={setWorkflow} />
      ) : null}
    </DashboardShell>
  );
}
