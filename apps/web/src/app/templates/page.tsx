"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, LayoutTemplate, X } from "lucide-react";
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
  const [preview, setPreview] = useState<Template | null>(null);

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
              <p className="mt-3 text-xs text-slate-500">
                {tpl.definition.nodes.length} nodes · {tpl.definition.edges.length} edges
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" className="btn-secondary justify-center" onClick={() => setPreview(tpl)}>
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
                <button
                  type="button"
                  className="btn-primary justify-center"
                  disabled={usingId === tpl.id}
                  onClick={() => void applyTemplate(tpl.id)}
                >
                  {usingId === tpl.id ? "Creating..." : "Use template"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="panel max-h-[85vh] w-full max-w-3xl overflow-hidden">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="font-display text-2xl text-slate-900">{preview.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{preview.description}</p>
              </div>
              <button
                type="button"
                className="rounded-md p-2 hover:bg-slate-100"
                onClick={() => setPreview(null)}
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 overflow-y-auto p-5 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-800">Example input</h4>
                <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-teal-100">
                  {JSON.stringify(preview.example_input, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-800">Node graph JSON</h4>
                <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-teal-100">
                  {JSON.stringify(preview.definition, null, 2)}
                </pre>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button type="button" className="btn-secondary" onClick={() => setPreview(null)}>
                Close
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={usingId === preview.id}
                onClick={() => void applyTemplate(preview.id)}
              >
                {usingId === preview.id ? "Creating..." : "Use template"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
