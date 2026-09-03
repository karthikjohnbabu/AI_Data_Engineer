"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { PipelineStrip } from "@/components/dashboard/PipelineStrip";
import { submitTicket } from "@/services/tickets";

export default function TriagePage() {
  const router = useRouter();
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    setLoading(true);
    setError("");
    try {
      const ticket = await submitTicket(summary.trim());
      router.push(`/tickets/${ticket.id}`);
    } catch {
      setError("Could not start triage. Is the Newton API running on :8000?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Triage"
        description="Submit work from Jira context — Newton classifies severity, risk, and routes the pipeline"
      />
      <div className="mb-6 rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
        <PipelineStrip compact />
      </div>
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-4 rounded-xl border border-slate-700/50 bg-slate-900/50 p-6"
      >
        <label className="block text-sm text-slate-400">Ticket summary / issue</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          placeholder="e.g. Glue job timeout on customer_dim load after source schema change"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading || !summary.trim()}>
          {loading ? "Starting Newton…" : "Run triage → investigation"}
        </Button>
      </form>
    </div>
  );
}
