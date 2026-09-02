"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common/Button";
import { verifyApiKey } from "@/services/auth";
import { setApiKey } from "@/utils/auth";

export default function LoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await verifyApiKey(key);
      if (!result.authRequired || result.valid) {
        if (result.authRequired) setApiKey(key);
        router.push("/");
      } else {
        setError("Invalid API key");
      }
    } catch {
      setError("Could not reach API. Check backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700/50 bg-slate-900 p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
            AI
          </div>
          <h1 className="text-xl font-bold text-white">AI Data Engineer</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to the agent platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">API Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter API key (if required)"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <button
          onClick={handleSkip}
          className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-300"
        >
          Continue without API key (demo mode)
        </button>
      </div>
    </div>
  );
}
