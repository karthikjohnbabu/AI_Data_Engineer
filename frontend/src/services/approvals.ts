import { apiFetch, apiFetchSafe } from "@/services/api";
import type { PendingAction } from "@/types";

export async function getApprovals(): Promise<PendingAction[]> {
  return apiFetchSafe("/approvals", []);
}

export async function decideApproval(id: string, approved: boolean) {
  return apiFetch(`/approvals/${id}/decide`, {
    method: "POST",
    body: JSON.stringify({ approved }),
  });
}
