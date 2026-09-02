import { apiFetchSafe } from "@/services/api";
import type { AgentRun } from "@/types";

export async function getRuns(): Promise<AgentRun[]> {
  const runs = await apiFetchSafe<
    {
      ticket_id: string;
      status: string;
      classification: string;
      severity: string;
      root_cause: string;
      confidence: number;
      summary: string;
      completed_at: string | null;
    }[]
  >("/runs", []);

  return runs.map((r) => ({
    ticketId: r.ticket_id,
    status: r.status as AgentRun["status"],
    classification: r.classification,
    severity: r.severity,
    rootCause: r.root_cause,
    confidence: r.confidence,
    summary: r.summary,
    completedAt: r.completed_at,
  }));
}
