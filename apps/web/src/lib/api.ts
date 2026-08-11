import type { RunStatus, WorkflowDefinition, WorkflowStatus } from "@flowpilot/shared";
import { apiBaseUrl } from "@/lib/client-config";

export type { RunStatus, WorkflowStatus } from "@flowpilot/shared";

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  definition:
    | WorkflowDefinition
    | {
        nodes: Array<Record<string, unknown>>;
        edges: Array<Record<string, unknown>>;
      };
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  user_id: string;
  status: RunStatus;
  input_payload: Record<string, unknown>;
  output_payload: Record<string, unknown> | null;
  error_message: string | null;
  logs: Array<Record<string, unknown>>;
  total_tokens: number;
  estimated_cost_usd: number;
  retry_count: number;
  duration_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  user_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  chunk_count: number;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  tags: string[];
  example_input: Record<string, unknown>;
  definition: Workflow["definition"];
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    let detail = res.statusText;
    let code: string | undefined;
    try {
      const data = await res.json();
      detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      code = data.code;
    } catch {
      /* ignore */
    }
    throw new ApiError(detail || "Request failed", res.status, code);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

function withQuery(path: string, params?: Record<string, string | number | undefined>) {
  if (!params) return path;
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    qs.set(key, String(value));
  });
  const query = qs.toString();
  return query ? `${path}?${query}` : path;
}

export const api = {
  listWorkflows: (params?: { status?: string; limit?: number; offset?: number }) =>
    request<Page<Workflow>>(withQuery("/workflows", params)),
  getWorkflow: (id: string) => request<Workflow>(`/workflows/${id}`),
  createWorkflow: (body: Partial<Workflow>) =>
    request<Workflow>("/workflows", { method: "POST", body: JSON.stringify(body) }),
  updateWorkflow: (id: string, body: Partial<Workflow>) =>
    request<Workflow>(`/workflows/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteWorkflow: (id: string) => request<void>(`/workflows/${id}`, { method: "DELETE" }),
  createRun: (workflowId: string, input: Record<string, unknown> = {}) =>
    request<WorkflowRun>(`/workflows/${workflowId}/runs`, {
      method: "POST",
      body: JSON.stringify({ input }),
    }),
  listRuns: (params?: { status?: string; limit?: number; offset?: number }) =>
    request<Page<WorkflowRun>>(withQuery("/runs", params)),
  getRun: (id: string) => request<WorkflowRun>(`/runs/${id}`),
  getRunNodes: (id: string) => request<Array<Record<string, unknown>>>(`/runs/${id}/nodes`),
  decideRun: (id: string, approved: boolean, note = "") =>
    request<WorkflowRun>(`/runs/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ approved, note }),
    }),
  listDocuments: (params?: { limit?: number; offset?: number }) =>
    request<Page<DocumentItem>>(withQuery("/documents", params)),
  uploadDocument: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<DocumentItem>("/documents/upload", { method: "POST", body: form });
  },
  deleteDocument: (id: string) => request<void>(`/documents/${id}`, { method: "DELETE" }),
  listTemplates: () => request<Template[]>("/templates"),
  useTemplate: (id: string, name?: string) =>
    request<Workflow>(`/templates/${id}/use`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  fetchWsToken: () => request<{ access_token: string }>("/auth/ws-token"),
};
