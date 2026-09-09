import { getApiKey, ensureApiKeyBootstrapped } from "@/utils/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export const TENANT_STORAGE_KEY = "newton-tenant-id";

export function getTenantId(): string {
  if (typeof window === "undefined") return "newton";
  return localStorage.getItem(TENANT_STORAGE_KEY) || "newton";
}

export function setTenantId(tenantId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
}

function getHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    ensureApiKeyBootstrapped();
    const apiKey = getApiKey();
    if (apiKey) headers["X-API-Key"] = apiKey;
    headers["X-Tenant-Id"] = getTenantId();
  }
  if (extra) {
    const extraObj =
      extra instanceof Headers
        ? Object.fromEntries(extra.entries())
        : Array.isArray(extra)
          ? Object.fromEntries(extra)
          : (extra as Record<string, string>);
    Object.assign(headers, extraObj);
  }
  return headers;
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const { headers: optHeaders, ...rest } = options || {};
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: "no-store",
    ...rest,
    headers: getHeaders(optHeaders as HeadersInit | undefined),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function apiFetchSafe<T>(
  endpoint: string,
  fallback: T,
  options?: RequestInit
): Promise<T> {
  try {
    return await apiFetch<T>(endpoint, options);
  } catch {
    return fallback;
  }
}
