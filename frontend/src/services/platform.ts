import type {
  DomainBaseline,
  PendingAction,
  ProjectConfig,
  Recommendation,
  TechStack,
  WorkflowDefinition,
} from "@/types";
import { apiFetch, apiFetchSafe } from "@/services/api";

export async function getTechStack(): Promise<TechStack> {
  return apiFetchSafe("/tech-stack", {
    detected: false,
    cloud: "not_configured",
    services: [],
    domain: "betting",
    client: "",
  });
}

export async function getCredentials() {
  return apiFetchSafe("/settings/credentials", []);
}

export async function saveCredentials(service: string, data: Record<string, string>) {
  return apiFetch("/settings/credentials", {
    method: "POST",
    body: JSON.stringify({ service, data }),
  });
}

export async function getOnboarding(): Promise<ProjectConfig> {
  return apiFetchSafe("/onboarding", {
    domain: "betting",
    projectType: "existing",
    context: "",
    clientName: "",
    onboarded: false,
  });
}

export async function saveOnboarding(config: ProjectConfig) {
  return apiFetch("/onboarding", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export async function getDomains(): Promise<DomainBaseline[]> {
  return apiFetchSafe("/domains", []);
}

export async function getWorkflows(): Promise<WorkflowDefinition[]> {
  return apiFetchSafe("/workflows", []);
}

export async function createWorkflow(name: string, description: string, phasesText: string) {
  return apiFetch("/workflows", {
    method: "POST",
    body: JSON.stringify({ name, description, phasesText }),
  });
}

export async function getRecommendations(): Promise<Recommendation[]> {
  return apiFetchSafe("/recommendations", []);
}

export async function generateRecommendations(): Promise<Recommendation[]> {
  return apiFetch("/recommendations/generate", { method: "POST" });
}

export async function dismissRecommendation(id: string) {
  return apiFetch(`/recommendations/${id}/dismiss`, { method: "POST" });
}

export async function getPendingActions(): Promise<PendingAction[]> {
  return apiFetchSafe("/notifications/pending", []);
}

export async function resolvePendingAction(id: string, approved: boolean) {
  return apiFetch(`/notifications/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({ approved }),
  });
}
