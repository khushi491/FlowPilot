"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { WorkflowNodeData } from "@/lib/workflow-types";
import { cn } from "@/lib/utils";

const accent: Record<string, string> = {
  llm: "border-teal-500",
  api: "border-sky-500",
  database: "border-amber-500",
  condition: "border-violet-500",
  rag: "border-emerald-500",
  approval: "border-orange-500",
  output: "border-slate-700",
};

export function BaseNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div
      className={cn(
        "min-w-[180px] rounded-xl border-2 bg-white px-3 py-2 shadow-sm",
        accent[nodeData.type] || "border-slate-300",
        selected && "ring-2 ring-teal-400 ring-offset-2"
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-500" />
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{nodeData.type}</div>
      <div className="text-sm font-semibold text-slate-900">{nodeData.label}</div>
      {nodeData.type === "condition" ? (
        <>
          <Handle
            type="source"
            id="true"
            position={Position.Right}
            style={{ top: "35%" }}
            className="!bg-emerald-500"
          />
          <Handle
            type="source"
            id="false"
            position={Position.Right}
            style={{ top: "70%" }}
            className="!bg-rose-500"
          />
        </>
      ) : (
        <Handle type="source" position={Position.Right} className="!bg-slate-500" />
      )}
    </div>
  );
}
