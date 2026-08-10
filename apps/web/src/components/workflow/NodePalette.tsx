"use client";

import { NODE_CATALOG, NodeType } from "@/lib/workflow-types";

const brickColors: Record<NodeType, string> = {
  llm: "bg-lego-yellow",
  api: "bg-lego-blue text-white",
  database: "bg-lego-orange text-white",
  condition: "bg-white",
  rag: "bg-lego-green text-white",
  approval: "bg-lego-red text-white",
  output: "bg-lego-ink text-white",
};

export function NodePalette({ onAdd }: { onAdd: (type: NodeType) => void }) {
  return (
    <div className="w-56 shrink-0 space-y-2 overflow-y-auto border-r-[3px] border-black bg-white p-3">
      <h3 className="font-display text-sm font-bold uppercase tracking-wide text-lego-ink">Brick bin</h3>
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
          className={`w-full rounded-brick border-[3px] border-black px-3 py-2 text-left shadow-brick transition hover:-translate-y-0.5 ${brickColors[item.type]}`}
        >
          <div className="text-sm font-extrabold">{item.label}</div>
          <div className="text-xs font-semibold opacity-80">{item.description}</div>
        </button>
      ))}
      <p className="pt-2 text-[11px] font-semibold text-black/50">Drag onto the baseplate or click to add.</p>
    </div>
  );
}
