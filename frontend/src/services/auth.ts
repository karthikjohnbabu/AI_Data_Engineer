import { apiFetch } from "@/services/api";

export async function verifyApiKey(apiKey: string): Promise<{ valid: boolean; authRequired: boolean }> {
  return apiFetch("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ apiKey }),
  });
}

export async function getAuthStatus(): Promise<{ authRequired: boolean }> {
  return apiFetch("/auth/status");
}
