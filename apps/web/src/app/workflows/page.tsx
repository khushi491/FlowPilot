"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Workflow } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, Workflow as WorkflowType } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async (nextOffset = offset) => {
    setLoading(true);
    setError(null);
    try {
      const page = await api.listWorkflows({ limit: PAGE_SIZE, offset: nextOffset });
      setWorkflows(page.items);
      setTotal(page.total);
      setOffset(page.offset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {error ? <ErrorState message={error} onRetry={() => void load(offset)} /> : null}
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
        <div>
          <div className="panel overflow-hidden">
            <table className="table-brick">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Nodes</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((wf) => (
                  <tr key={wf.id}>
                    <td>
                      <Link href={`/workflows/${wf.id}`} className="font-medium text-slate-900 hover:text-teal-700">
                        {wf.name}
                      </Link>
                      <p className="text-xs text-slate-500">{wf.description || "—"}</p>
                    </td>
                    <td>
                      <StatusBadge status={wf.status} />
                    </td>
                    <td className="text-slate-600">{wf.definition?.nodes?.length ?? 0}</td>
                    <td className="text-slate-600">{formatDate(wf.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
