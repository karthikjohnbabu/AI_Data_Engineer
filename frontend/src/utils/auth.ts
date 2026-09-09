const API_KEY_STORAGE = "ai-de-agent-api-key";

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(API_KEY_STORAGE);
  if (stored) return stored;
  const fromEnv = process.env.NEXT_PUBLIC_API_KEY;
  if (fromEnv) {
    localStorage.setItem(API_KEY_STORAGE, fromEnv);
    return fromEnv;
  }
  return null;
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE, key);
}

export function clearApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE);
}

/** Ensure local demo key is available before first API call. */
export function ensureApiKeyBootstrapped(): string | null {
  return getApiKey();
}
