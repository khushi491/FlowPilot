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

const runStatusClass: Record<string, string> = {
  pending: "opacity-70",
  running: "animate-brick-pulse ring-4 ring-lego-yellow ring-offset-2",
  completed: "animate-brick-complete ring-4 ring-lego-green ring-offset-1",
  failed: "ring-4 ring-lego-red ring-offset-2",
  waiting_approval: "animate-brick-pulse ring-4 ring-amber-400 ring-offset-2",
  skipped: "opacity-40 grayscale",
};

const runStatusLabel: Record<string, string> = {
  pending: "Queued",
  running: "Running",
  completed: "Done",
  failed: "Failed",
  waiting_approval: "Approval",
  skipped: "Skipped",
};

export function BaseNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData & {
    runStatus?: string;
    justDropped?: boolean;
  };
  const runStatus = nodeData.runStatus;

  return (
    <div
      className={cn(
        "min-w-[190px] rounded-brick border-[3px] border-black px-3 py-2 shadow-brick transition",
        brick[nodeData.type] || "bg-white",
        selected && !runStatus && "ring-4 ring-lego-yellow ring-offset-2",
        runStatus && runStatusClass[runStatus],
        nodeData.justDropped && "animate-brick-drop"
      )}
    >
      <div className="mb-1 flex gap-1">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full border border-black/40 bg-white/70",
            runStatus === "completed" && "animate-stud-bounce bg-lego-green"
          )}
        />
        <span className="h-2.5 w-2.5 rounded-full border border-black/40 bg-white/70" />
        <span className="h-2.5 w-2.5 rounded-full border border-black/40 bg-white/70" />
      </div>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-black !bg-lego-yellow" />
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-extrabold uppercase tracking-wide opacity-80">{nodeData.type}</div>
        {runStatus ? (
          <span className="brick-chip bg-white/90 text-lego-ink">{runStatusLabel[runStatus] || runStatus}</span>
        ) : null}
      </div>
      <div className="text-sm font-extrabold">{nodeData.label}</div>
      {nodeData.type === "database" || nodeData.type === "llm" || nodeData.type === "rag" ? (
        <div className="mt-1 text-[9px] font-extrabold uppercase tracking-wide opacity-70">
          {nodeData.type === "database" ? "Always mock" : "Mock by default"}
        </div>
      ) : null}
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
