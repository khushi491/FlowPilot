"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Workflow } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, Workflow as WorkflowType } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setWorkflows(await api.listWorkflows());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createWorkflow = async () => {
    setCreating(true);
    try {
      const wf = await api.createWorkflow({
        name: "Untitled workflow",
        description: "New FlowPilot automation",
        status: "draft",
        definition: { nodes: [], edges: [] },
        tags: [],
      });
      router.push(`/workflows/${wf.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workflow");
      setCreating(false);
    }
  };

  return (
    <DashboardShell
      title="Workflows"
      subtitle="Create and manage visual AI-agent automations."
      actions={
        <button type="button" className="btn-primary" onClick={createWorkflow} disabled={creating}>
          <Plus className="h-4 w-4" />
          {creating ? "Creating..." : "Create workflow"}
        </button>
      }
    >
      {loading ? <LoadingState label="Loading workflows..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && workflows.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No workflows yet"
          description="Start from a blank canvas or use a template to bootstrap an agent workflow."
          action={
            <div className="flex gap-2">
              <button type="button" className="btn-primary" onClick={createWorkflow}>
                Create workflow
              </button>
              <Link href="/templates" className="btn-secondary">
                Browse templates
              </Link>
            </div>
          }
        />
      ) : null}
      {!loading && !error && workflows.length > 0 ? (
        <div className="panel overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Nodes</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((wf) => (
                <tr key={wf.id} className="border-t border-slate-100 hover:bg-teal-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/workflows/${wf.id}`} className="font-medium text-slate-900 hover:text-teal-700">
                      {wf.name}
                    </Link>
                    <p className="text-xs text-slate-500">{wf.description || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={wf.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{wf.definition?.nodes?.length ?? 0}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(wf.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </DashboardShell>
  );
}
