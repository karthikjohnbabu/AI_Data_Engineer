const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function getHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const apiKey = localStorage.getItem("ai-de-agent-api-key");
    if (apiKey) headers["X-API-Key"] = apiKey;
  }
  return { ...headers, ...extra };
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: getHeaders(options?.headers as HeadersInit),
    cache: "no-store",
    ...options,
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
