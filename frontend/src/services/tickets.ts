import { tickets, ticketDetails } from "@/data/mock/tickets";
import type { Ticket, TicketDetail } from "@/types";

export async function getTickets(): Promise<Ticket[]> {
  return Promise.resolve(tickets);
}

export async function getTicketById(id: string): Promise<TicketDetail | null> {
  const detail = ticketDetails[id];
  if (detail) return Promise.resolve(detail);

  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return Promise.resolve(null);

  return Promise.resolve({
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
  });
}
