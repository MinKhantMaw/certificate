export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const runtimeEnv = (import.meta as ImportMeta & { env?: { MODE?: string } }).env;
export const apiEnabled = runtimeEnv?.MODE !== "test";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });
  const text = await response.text();
  let body: any;
  if (text) {
    try { body = JSON.parse(text); } catch { body = { error: text }; }
  }
  if (!response.ok) {
    throw new ApiError(body?.error || "The server request failed.", response.status);
  }
  return body as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: import("../types").User; token?: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  me: () => request<import("../types").User>("/api/auth/me"),
  templates: () => request<import("../types").DocumentTemplate[]>("/api/templates"),
  createTemplate: (template: import("../types").DocumentTemplate) =>
    request<import("../types").DocumentTemplate>("/api/templates", {
      method: "POST",
      body: JSON.stringify(template),
    }),
  updateTemplate: (template: import("../types").DocumentTemplate) =>
    request<import("../types").DocumentTemplate>(`/api/templates/${template.id}`, {
      method: "PUT",
      body: JSON.stringify(template),
    }),
  deleteTemplate: (id: string) => request<void>(`/api/templates/${id}`, { method: "DELETE" }),
  documents: (templateId?: string) => request<import("../types").Document[]>(
    `/api/documents${templateId ? `?templateId=${encodeURIComponent(templateId)}` : ""}`,
  ),
  document: (id: string) => request<import("../types").Document>(`/api/documents/${encodeURIComponent(id)}`),
  updateDocumentStatus: (id: string, status: import("../types").Document["status"]) =>
    request<import("../types").Document>(`/api/documents/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteDocument: (id: string) => request<void>(`/api/documents/${encodeURIComponent(id)}`, { method: "DELETE" }),
  generateDocuments: (input: { templateId: string; fileName: string; uploadedBy?: string; rows: import("../types").ImportedRow[] }) =>
    request<{ batchId: string; documents: import("../types").Document[] }>("/api/imports", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  importBatches: () => request<import("../types").ImportBatch[]>("/api/imports"),
  verify: (token: string) => request<import("../types").Document>(`/api/verify/${encodeURIComponent(token)}`),
};
