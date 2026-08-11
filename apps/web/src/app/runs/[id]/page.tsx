"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Radio, X } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { NodeTrace, NodeTraceDrawer } from "@/components/runs/NodeTraceDrawer";
import { RunTimeline } from "@/components/runs/RunTimeline";
import { useRunSocket } from "@/hooks/useRunSocket";
import { api, WorkflowRun } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function RunDetailPage() {
  const params = useParams<{ id: string }>();
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [nodes, setNodes] = useState<NodeTrace[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [deciding, setDeciding] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const { events, connected, status } = useRunSocket(params.id);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [runData, nodeData] = await Promise.all([api.getRun(params.id), api.getRunNodes(params.id)]);
      setRun(runData);
      setNodes(nodeData as unknown as NodeTrace[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load run");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    if (!events.length) return;
    const latest = events[events.length - 1];
    if (latest.status && run) {
      setRun({ ...run, status: latest.status as WorkflowRun["status"] });
    }
    if (latest.type === "node.status" || latest.type === "run.status") {
      void api.getRunNodes(params.id).then((nodeData) => setNodes(nodeData as unknown as NodeTrace[]));
      void api.getRun(params.id).then(setRun).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.node_id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const effectiveStatus = status || run?.status;
  const waitingNode = nodes.find((n) => n.status === "waiting_approval");

  const submitDecision = async (approved: boolean) => {
    setDeciding(true);
    setDecisionError(null);
    try {
      const updated = await api.decideRun(params.id, approved, decisionNote.trim());
      setRun(updated);
      setDecisionNote("");
      const nodeData = await api.getRunNodes(params.id);
      setNodes(nodeData as unknown as NodeTrace[]);
    } catch (err) {
      setDecisionError(err instanceof Error ? err.message : "Failed to submit decision");
    } finally {
      setDeciding(false);
    }
  };

  return (
    <DashboardShell
      title="Run details"
      subtitle="Live status stream, timeline, and node-level traces."
      actions={
        <Link href="/runs" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          All runs
        </Link>
      }
    >
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && run ? (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="panel space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={effectiveStatus || run.status} />
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Radio className={`h-3.5 w-3.5 ${connected ? "text-emerald-600" : "text-slate-400"}`} />
                {connected ? "Live connected" : "Connecting…"}
              </span>
              <span className="text-xs text-slate-500">Created {formatDate(run.created_at)}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Metric label="Tokens" value={String(run.total_tokens)} />
              <Metric label="Cost" value={`$${run.estimated_cost_usd.toFixed(4)}`} />
              <Metric label="Retries" value={String(run.retry_count)} />
              <Metric label="Duration" value={run.duration_ms != null ? `${run.duration_ms} ms` : "—"} />
            </div>
            {effectiveStatus === "paused" ? (
              <div className="space-y-3 rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3">
                <div>
                  <h2 className="font-semibold text-amber-950">Approval required</h2>
                  <p className="text-sm text-amber-900/80">
                    {waitingNode
                      ? `Waiting on node ${waitingNode.node_id}. Approve to continue or reject to fail the run.`
                      : "This run is paused for human approval."}
                  </p>
                </div>
                <label className="block text-sm text-amber-950">
                  Note (optional)
                  <textarea
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-slate-900"
                    placeholder="Reason for approval or rejection"
                  />
                </label>
                {decisionError ? <p className="text-sm text-rose-700">{decisionError}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-primary inline-flex items-center gap-1"
                    disabled={deciding}
                    onClick={() => void submitDecision(true)}
                  >
                    <Check className="h-4 w-4" />
                    Approve & continue
                  </button>
                  <button
                    type="button"
                    className="btn-secondary inline-flex items-center gap-1 border-rose-300 text-rose-800"
                    disabled={deciding}
                    onClick={() => void submitDecision(false)}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            ) : null}
            {run.error_message ? (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{run.error_message}</div>
            ) : null}
            <div>
              <h2 className="mb-2 font-semibold text-slate-900">Live timeline</h2>
              <RunTimeline events={events} onSelectNode={setSelectedNodeId} />
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Node runs</h2>
            {nodes.length === 0 ? (
              <p className="text-sm text-slate-500">Node traces will appear as execution progresses.</p>
            ) : (
              <ul className="space-y-2">
                {nodes.map((node) => (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId(node.node_id)}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left hover:border-teal-400 hover:bg-teal-50/40"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-900">{node.node_id}</div>
                        <div className="text-xs capitalize text-slate-500">{node.node_type}</div>
                      </div>
                      <StatusBadge status={node.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Final output</h3>
              <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-teal-100">
                {JSON.stringify(
                  run.output_payload && "_pause" in run.output_payload
                    ? { paused: true, checkpoint: run.output_payload._pause }
                    : run.output_payload,
                  null,
                  2
                )}
              </pre>
            </div>
          </section>
        </div>
      ) : null}
      <NodeTraceDrawer node={selectedNode} onClose={() => setSelectedNodeId(null)} />
    </DashboardShell>
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
