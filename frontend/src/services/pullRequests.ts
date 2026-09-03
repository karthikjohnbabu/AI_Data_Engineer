import { apiFetchSafe } from "@/services/api";

export interface PullRequestItem {
  id: string;
  ticketId: string;
  title: string;
  status: string;
  confidence: number;
  severity?: string;
  createdAt?: string | null;
}

export async function getPullRequests(): Promise<PullRequestItem[]> {
  return apiFetchSafe("/pull-requests", []);
}
