"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { api, Template } from "@/lib/api";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingId, setUsingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setTemplates(await api.listTemplates());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const applyTemplate = async (id: string) => {
    setUsingId(id);
    try {
      const wf = await api.useTemplate(id);
      router.push(`/workflows/${wf.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to use template");
      setUsingId(null);
    }
  };

  return (
    <DashboardShell title="Templates" subtitle="Start faster with curated agent workflow blueprints.">
      {loading ? <LoadingState label="Loading templates..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates available"
          description="Built-in templates will appear here once the API is reachable."
        />
      ) : null}
      {!loading && !error && templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((tpl) => (
            <article key={tpl.id} className="panel flex flex-col p-5">
              <h2 className="font-display text-xl text-slate-900">{tpl.name}</h2>
              <p className="mt-2 flex-1 text-sm text-slate-600">{tpl.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tpl.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-teal-50 px-2 py-1 text-xs text-teal-800">
                    {tag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="btn-primary mt-5 w-full justify-center"
                disabled={usingId === tpl.id}
                onClick={() => void applyTemplate(tpl.id)}
              >
                {usingId === tpl.id ? "Creating..." : "Use template"}
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </DashboardShell>
  );
}
