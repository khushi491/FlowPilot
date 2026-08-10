export type WorkflowStatus = "draft" | "active" | "paused" | "failed";
export type RunStatus = "queued" | "running" | "completed" | "failed" | "paused";
export type NodeRunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "waiting_approval";

export type NodeType =
  | "llm"
  | "api"
  | "database"
  | "condition"
  | "rag"
  | "approval"
  | "output";

export interface WorkflowNodeData {
  label: string;
  type: NodeType;
  config: Record<string, unknown>;
}

export interface WorkflowDefinition {
  nodes: Array<{
    id: string;
    type: NodeType;
    position: { x: number; y: number };
    data: WorkflowNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  exampleInput: Record<string, unknown>;
  definition: WorkflowDefinition;
}
