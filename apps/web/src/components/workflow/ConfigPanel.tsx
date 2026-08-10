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
      <div className="w-80 shrink-0 border-l border-slate-200 bg-white p-4 text-sm text-slate-500">
        Select a node to configure its settings.
      </div>
    );
  }

  const data = node.data as WorkflowNodeData;
  const config = data.config || {};

  const setConfig = (key: string, value: unknown) => {
    onChange(node.id, { config: { ...config, [key]: value } });
  };

  return (
    <div className="w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Configuration</h3>
        <button type="button" className="text-xs text-slate-500 hover:text-slate-800" onClick={onClose}>
          Close
        </button>
      </div>
      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-slate-600">Label</span>
        <input
          className="w-full rounded-md border border-slate-300 px-2 py-1.5"
          value={data.label}
          onChange={(e) => onChange(node.id, { label: e.target.value })}
        />
      </label>
      <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">{data.type} node</p>

      {data.type === "llm" ? (
        <>
          <Field label="Prompt" value={String(config.prompt || "")} onChange={(v) => setConfig("prompt", v)} textarea />
          <Field label="Model" value={String(config.model || "")} onChange={(v) => setConfig("model", v)} />
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
        <Field label="Query" value={String(config.query || "")} onChange={(v) => setConfig("query", v)} textarea />
      ) : null}
      {data.type === "condition" ? (
        <Field
          label="Expression"
          value={String(config.expression || "")}
          onChange={(v) => setConfig("expression", v)}
          textarea
        />
      ) : null}
      {data.type === "rag" ? (
        <>
          <Field label="Query" value={String(config.query || "")} onChange={(v) => setConfig("query", v)} textarea />
          <Field
            label="Top K"
            value={String(config.top_k ?? 4)}
            onChange={(v) => setConfig("top_k", Number(v) || 4)}
          />
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
    <label className="mb-3 block text-sm">
      <span className="mb-1 block text-slate-600">{label}</span>
      {textarea ? (
        <textarea
          className="min-h-24 w-full rounded-md border border-slate-300 px-2 py-1.5 font-mono text-xs"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="w-full rounded-md border border-slate-300 px-2 py-1.5"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
