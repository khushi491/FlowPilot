"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Workflow as WorkflowIcon, PlayCircle, FileText } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, Workflow, WorkflowRun } from "@/lib/api";

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [workflowTotal, setWorkflowTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, r] = await Promise.all([
        api.listWorkflows({ limit: 5, offset: 0 }),
        api.listRuns({ limit: 5, offset: 0 }),
      ]);
      setWorkflows(w.items);
      setRuns(r.items);
      setWorkflowTotal(w.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <DashboardShell
      title="Dashboard"
      subtitle="Monitor workflows, runs, and document knowledge at a glance."
      actions={
        <Link href="/workflows" className="btn-primary">
          <Plus className="h-4 w-4" />
          New workflow
        </Link>
      }
    >
      {loading ? <LoadingState label="Loading dashboard..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Workflows", value: workflowTotal, icon: WorkflowIcon },
              { label: "Recent runs", value: runs.length, icon: PlayCircle },
              {
                label: "Active (page)",
                value: workflows.filter((w) => w.status === "active").length,
                icon: FileText,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="panel p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{label}</p>
                  <Icon className="h-4 w-4 text-teal-700" />
                </div>
                <p className="mt-3 font-display text-3xl text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <section className="panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Latest workflows</h2>
              <Link href="/workflows" className="text-sm text-teal-700 hover:underline">
                View all
              </Link>
            </div>
            {workflows.length === 0 ? (
              <p className="text-sm text-slate-500">No workflows yet. Create your first automation.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {workflows.map((wf) => (
                  <li key={wf.id} className="flex items-center justify-between py-3">
                    <div>
                      <Link href={`/workflows/${wf.id}`} className="font-medium text-slate-900 hover:text-teal-700">
                        {wf.name}
                      </Link>
                      <p className="text-xs text-slate-500">{wf.description || "No description"}</p>
                    </div>
                    <StatusBadge status={wf.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </DashboardShell>
  );
}
