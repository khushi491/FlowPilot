const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type WorkflowStatus = "draft" | "active" | "paused" | "failed";
export type RunStatus = "queued" | "running" | "completed" | "failed" | "paused";

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  definition: {
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

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return {};
  }
  const token = localStorage.getItem("flowpilot_token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  const auth = authHeaders();
  Object.entries(auth).forEach(([k, v]) => headers.set(k, v));
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
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

export const api = {
  listWorkflows: () => request<Workflow[]>("/workflows"),
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
  listRuns: (params?: { status?: string }) => {
    const q = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
    return request<WorkflowRun[]>(`/runs${q}`);
  },
  getRun: (id: string) => request<WorkflowRun>(`/runs/${id}`),
  getRunNodes: (id: string) => request<Array<Record<string, unknown>>>(`/runs/${id}/nodes`),
  decideRun: (id: string, approved: boolean, note = "") =>
    request<WorkflowRun>(`/runs/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ approved, note }),
    }),
  listDocuments: () => request<DocumentItem[]>("/documents"),
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
};
