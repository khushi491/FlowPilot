"use client";

import { Node } from "@xyflow/react";
import { WorkflowNodeData } from "@/lib/workflow-types";

export function ConfigPanel({
  node,
  onChange,
  onClose,
}: {
  node: Node | null;
  onChange: (nodeId: string, patch: Partial<WorkflowNodeData>) => void;
  onClose: () => void;
}) {
  if (!node) {
    return (
      <div className="w-80 shrink-0 border-l-[3px] border-black bg-white p-4 text-sm font-semibold text-black/50">
        Select a brick to configure its studs and settings.
      </div>
    );
  }

  const data = node.data as WorkflowNodeData;
  const config = data.config || {};

  const setConfig = (key: string, value: unknown) => {
    onChange(node.id, { config: { ...config, [key]: value } });
  };

  return (
    <div className="w-80 shrink-0 overflow-y-auto border-l-[3px] border-black bg-lego-yellow/30 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-lego-ink">Brick config</h3>
        <button type="button" className="text-xs font-bold uppercase text-black/60 hover:text-black" onClick={onClose}>
          Close
        </button>
      </div>
      <label className="mb-3 block text-sm font-bold">
        <span className="mb-1 block">Label</span>
        <input
          className="input-lego"
          value={data.label}
          onChange={(e) => onChange(node.id, { label: e.target.value })}
        />
      </label>
      <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">{data.type} node</p>

      {data.type === "llm" ? (
        <>
          <Field label="Prompt" value={String(config.prompt || "")} onChange={(v) => setConfig("prompt", v)} textarea />
          <Field label="Model" value={String(config.model || "")} onChange={(v) => setConfig("model", v)} />
          <p className="mb-3 text-xs text-black/60">
            Default mode returns mock LLM output unless a real API key is configured on the server.
          </p>
        </>
      ) : null}
      {data.type === "api" ? (
        <>
          <Field label="Method" value={String(config.method || "GET")} onChange={(v) => setConfig("method", v)} />
          <Field label="URL" value={String(config.url || "")} onChange={(v) => setConfig("url", v)} />
          <Field
            label="Body"
            value={typeof config.body === "string" ? config.body : JSON.stringify(config.body || "", null, 2)}
            onChange={(v) => setConfig("body", v)}
            textarea
          />
        </>
      ) : null}
      {data.type === "database" ? (
        <>
          <Field label="Query" value={String(config.query || "")} onChange={(v) => setConfig("query", v)} textarea />
          <p className="mb-3 text-xs text-black/60">
            This brick is demo-only: it never executes SQL and always returns a mock row.
          </p>
        </>
      ) : null}
      {data.type === "condition" ? (
        <>
          <Field
            label="Expression"
            value={String(config.expression || "")}
            onChange={(v) => setConfig("expression", v)}
            textarea
          />
          <p className="mb-3 text-xs text-black/60">
            Safe DSL only (comparisons / and / or / not). Example: score &gt; 50
          </p>
        </>
      ) : null}
      {data.type === "rag" ? (
        <>
          <Field label="Query" value={String(config.query || "")} onChange={(v) => setConfig("query", v)} textarea />
          <Field
            label="Top K"
            value={String(config.top_k ?? 4)}
            onChange={(v) => setConfig("top_k", Number(v) || 4)}
          />
          <p className="mb-3 text-xs text-black/60">
            Uses mock embeddings by default; set USE_MOCK_EMBEDDINGS=false with an API key for real vectors.
          </p>
        </>
      ) : null}
      {data.type === "approval" ? (
        <Field label="Message" value={String(config.message || "")} onChange={(v) => setConfig("message", v)} textarea />
      ) : null}
      {data.type === "output" ? (
        <Field label="Output key" value={String(config.key || "")} onChange={(v) => setConfig("key", v)} />
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="mb-3 block text-sm font-bold">
      <span className="mb-1 block">{label}</span>
      {textarea ? (
        <textarea
          className="input-lego min-h-24 font-mono text-xs"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input className="input-lego" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
