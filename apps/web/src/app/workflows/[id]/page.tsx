"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { NodeTrace, NodeTraceDrawer } from "@/components/runs/NodeTraceDrawer";
import { WorkflowEditor } from "@/components/workflow/WorkflowEditor";
import { useRunSocket } from "@/hooks/useRunSocket";
import { api, Workflow } from "@/lib/api";

export default function WorkflowDetailPage() {
  const params = useParams<{ id: string }>();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [nodeTraces, setNodeTraces] = useState<NodeTrace[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const { events, connected, status } = useRunSocket(activeRunId);

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

  useEffect(() => {
    if (!activeRunId || !events.length) return;
    const latest = events[events.length - 1];
    if (latest.type === "node.status" || latest.type === "run.status") {
      void api
        .getRunNodes(activeRunId)
        .then((nodeData) => setNodeTraces(nodeData as unknown as NodeTrace[]))
        .catch(() => undefined);
    }
  }, [events, activeRunId]);

  const runStatuses = useMemo(() => {
    const map: Record<string, string> = {};
    for (const node of nodeTraces) {
      map[node.node_id] = node.status;
    }
    return map;
  }, [nodeTraces]);

  const selectedTrace = useMemo(
    () => nodeTraces.find((n) => n.node_id === selectedTraceId) || null,
    [nodeTraces, selectedTraceId]
  );

  const runWorkflow = async () => {
    if (!workflow) return;
    setRunning(true);
    setError(null);
    try {
      const run = await api.createRun(workflow.id, {});
      setActiveRunId(run.id);
      setNodeTraces([]);
      setSelectedTraceId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start run");
    } finally {
      setRunning(false);
    }
  };

  return (
    <DashboardShell
      title={workflow?.name || "Workflow builder"}
      subtitle="Drag bricks, snap edges, then run and watch each brick light up live."
      actions={
        <div className="flex gap-2">
          <Link href="/workflows" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <button type="button" className="btn-primary" onClick={() => void runWorkflow()} disabled={!workflow || running}>
            <Play className="h-4 w-4" />
            {running ? "Starting..." : activeRunId ? "Run again" : "Run"}
          </button>
        </div>
      }
    >
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && workflow ? (
        <WorkflowEditor
          workflow={workflow}
          onSaved={setWorkflow}
          activeRunId={activeRunId}
          runStatuses={runStatuses}
          runLiveStatus={status}
          runConnected={connected}
          onSelectRunNode={setSelectedTraceId}
        />
      ) : null}
      <NodeTraceDrawer node={selectedTrace} onClose={() => setSelectedTraceId(null)} />
    </DashboardShell>
  );
}
