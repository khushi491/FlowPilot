export type {
  NodeType,
  WorkflowDefinition,
  WorkflowNodeData as SharedWorkflowNodeData,
} from "@flowpilot/shared";
import type { NodeType, WorkflowNodeData as SharedWorkflowNodeData } from "@flowpilot/shared";

export interface WorkflowNodeData extends SharedWorkflowNodeData {
  [key: string]: unknown;
}

export const NODE_CATALOG: Array<{
  type: NodeType;
  label: string;
  description: string;
  defaults: Record<string, unknown>;
}> = [
  {
    type: "llm",
    label: "LLM Prompt (mock by default)",
    description: "Call an LLM with a prompt template (uses mock responses unless OpenAI is configured)",
    defaults: { prompt: "", model: "gpt-4o-mini", temperature: 0.2 },
  },
  {
    type: "api",
    label: "API Request",
    description: "Perform an HTTP request",
    defaults: { method: "GET", url: "", headers: {}, body: "" },
  },
  {
    type: "database",
    label: "Mock Database",
    description: "Demo-only mock SQL result (does not run real queries)",
    defaults: { query: "SELECT 1", params: {} },
  },
  {
    type: "condition",
    label: "Condition",
    description: "Branch with a safe expression (e.g. score > 50)",
    defaults: { expression: "input.value == true" },
  },
  {
    type: "rag",
    label: "RAG Search",
    description: "Retrieve document chunks (mock embeddings by default)",
    defaults: { query: "", top_k: 4 },
  },
  {
    type: "approval",
    label: "Human Approval",
    description: "Pause for manual approval",
    defaults: { message: "Approve to continue" },
  },
  {
    type: "output",
    label: "Output",
    description: "Store the final workflow response",
    defaults: { key: "result" },
  },
];

export function requiredFieldsFor(type: NodeType): string[] {
  switch (type) {
    case "llm":
      return ["prompt"];
    case "api":
      return ["url", "method"];
    case "database":
      return ["query"];
    case "condition":
      return ["expression"];
    case "rag":
      return ["query"];
    case "approval":
      return ["message"];
    case "output":
      return ["key"];
    default:
      return [];
  }
}

export function validateWorkflowDefinition(definition: {
  nodes: Array<{ id: string; type?: string; data?: WorkflowNodeData }>;
  edges: Array<{ id: string; source: string; target: string }>;
}): string[] {
  const errors: string[] = [];
  if (!definition.nodes?.length) {
    errors.push("Add at least one node before saving.");
  }
  for (const node of definition.nodes || []) {
    const type = (node.data?.type || node.type) as NodeType;
    const label = node.data?.label || node.id;
    const config = node.data?.config || {};
    for (const field of requiredFieldsFor(type)) {
      const value = config[field];
      if (value === undefined || value === null || String(value).trim() === "") {
        errors.push(`${label}: missing required field "${field}".`);
      }
    }
  }
  return errors;
}
