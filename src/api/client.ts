import type { components } from "./schema";

export type Repository = components["schemas"]["RepositoryOut"];
export type Analysis = components["schemas"]["AnalysisOut"];
export type Report = components["schemas"]["AnalysisReport"];
export type Finding = components["schemas"]["Finding"];

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail)) detail = body.detail.map((d: { msg: string }) => d.msg).join("; ");
    } catch {
      /* keep statusText */
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listRepositories: () => request<Repository[]>("/repositories"),
  getRepository: (id: number) => request<Repository>(`/repositories/${id}`),
  addRepository: (url: string) => request<Repository>("/repositories", { method: "POST", body: JSON.stringify({ url }) }),
  startAnalysis: (repoId: number) => request<Analysis>(`/repositories/${repoId}/analyses`, { method: "POST" }),
  listAnalyses: (repoId: number) => request<Analysis[]>(`/repositories/${repoId}/analyses`),
  getAnalysis: (id: number) => request<Analysis>(`/analyses/${id}`),
  getReport: (id: number) => request<Report>(`/analyses/${id}/report`),
};
