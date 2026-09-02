import { tickets, ticketDetails } from "@/data/mock/tickets";
import { apiFetch, apiFetchSafe } from "@/services/api";
import type { Ticket, TicketDetail } from "@/types";

export async function getTickets(): Promise<Ticket[]> {
  return apiFetchSafe("/tickets", tickets);
}

export async function getTicketById(id: string): Promise<TicketDetail | null> {
  try {
    return await apiFetch<TicketDetail>(`/tickets/${encodeURIComponent(id)}`);
  } catch {
    const detail = ticketDetails[id];
    if (detail) return detail;

    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) return null;

    return {
      ...ticket,
      description: ticket.summary,
      rootCause: "Analysis in progress...",
      impact: {
        level: "Medium",
        filesAffected: 0,
        tablesAffected: 0,
        blastRadius: "Low",
      },
      timeline: [],
      impactedFiles: [],
      codeChanges: [],
      testResults: [],
      dataValidation: [],
      deployments: [],
    };
  }
}

export async function approveTicket(id: string): Promise<void> {
  await apiFetch(`/tickets/${encodeURIComponent(id)}/approve`, {
    method: "POST",
  });
}

export async function rejectTicket(id: string): Promise<void> {
  await apiFetch(`/tickets/${encodeURIComponent(id)}/reject`, {
    method: "POST",
  });
}

export async function runTicketAgain(id: string): Promise<TicketDetail | null> {
  await apiFetch(`/tickets/${encodeURIComponent(id)}/run-again`, {
    method: "POST",
  });
  return getTicketById(id);
}

export async function createPullRequest(id: string): Promise<void> {
  await apiFetch(`/tickets/${encodeURIComponent(id)}/create-pr`, {
    method: "POST",
  });
}
