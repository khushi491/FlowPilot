"use client";

import { NODE_CATALOG, NodeType } from "@/lib/workflow-types";

export function NodePalette({ onAdd }: { onAdd: (type: NodeType) => void }) {
  return (
    <div className="w-56 shrink-0 space-y-2 overflow-y-auto border-r border-slate-200 bg-white p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nodes</h3>
      {NODE_CATALOG.map((item) => (
        <button
          key={item.type}
          type="button"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("application/flowpilot-node", item.type);
            e.dataTransfer.effectAllowed = "move";
          }}
          onClick={() => onAdd(item.type)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-teal-400 hover:bg-teal-50"
        >
          <div className="text-sm font-medium text-slate-900">{item.label}</div>
          <div className="text-xs text-slate-500">{item.description}</div>
        </button>
      ))}
      <p className="pt-2 text-[11px] text-slate-400">Drag onto the canvas or click to add.</p>
    </div>
  );
}
