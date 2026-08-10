"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { WorkflowNodeData } from "@/lib/workflow-types";
import { cn } from "@/lib/utils";

const brick: Record<string, string> = {
  llm: "bg-lego-yellow",
  api: "bg-lego-blue text-white",
  database: "bg-lego-orange text-white",
  condition: "bg-white",
  rag: "bg-lego-green text-white",
  approval: "bg-lego-red text-white",
  output: "bg-lego-ink text-white",
};

export function BaseNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div
      className={cn(
        "min-w-[190px] rounded-brick border-[3px] border-black px-3 py-2 shadow-brick",
        brick[nodeData.type] || "bg-white",
        selected && "ring-4 ring-lego-yellow ring-offset-2"
      )}
    >
      <div className="mb-1 flex gap-1">
        <span className="h-2.5 w-2.5 rounded-full border border-black/40 bg-white/70" />
        <span className="h-2.5 w-2.5 rounded-full border border-black/40 bg-white/70" />
        <span className="h-2.5 w-2.5 rounded-full border border-black/40 bg-white/70" />
      </div>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-black !bg-lego-yellow" />
      <div className="text-[10px] font-extrabold uppercase tracking-wide opacity-80">{nodeData.type}</div>
      <div className="text-sm font-extrabold">{nodeData.label}</div>
      {nodeData.type === "condition" ? (
        <>
          <Handle
            type="source"
            id="true"
            position={Position.Right}
            style={{ top: "35%" }}
            className="!h-3 !w-3 !border-2 !border-black !bg-lego-green"
          />
          <Handle
            type="source"
            id="false"
            position={Position.Right}
            style={{ top: "70%" }}
            className="!h-3 !w-3 !border-2 !border-black !bg-lego-red"
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-black !bg-lego-yellow"
        />
      )}
    </div>
  );
}
