"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getTickets, submitTicket } from "@/services/tickets";
import type { Ticket, TicketDetail, TicketStatus } from "@/types";
import { useRouter } from "next/navigation";

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "All">("All");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newSummary, setNewSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadTickets() {
    getTickets()
      .then(setTickets)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function handleSubmitTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!newSummary.trim()) return;
    setSubmitting(true);
    try {
      const ticket = await submitTicket(newSummary.trim());
      setShowNewTicket(false);
      setNewSummary("");
      router.push(`/tickets/${ticket.id}`);
    } catch {
      alert("Failed to submit ticket. Is the API running?");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        search === "" ||
        ticket.id.toLowerCase().includes(search.toLowerCase()) ||
        ticket.summary.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Tickets"
        description="Jira tickets processed by the AI agent"
        actions={
          <Button onClick={() => setShowNewTicket(true)}>
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        }
      />

      {showNewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white">Submit New Ticket</h2>
            <p className="mt-1 text-sm text-slate-400">
              Describe the data engineering issue. The agent will investigate automatically.
            </p>
            <form onSubmit={handleSubmitTicket} className="mt-4 space-y-4">
              <textarea
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="e.g. Glue job timeout on customer_dim load"
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                required
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowNewTicket(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit & Investigate"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as TicketStatus | "All")
          }
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Done">Done</option>
          <option value="In Progress">In Progress</option>
          <option value="In Review">In Review</option>
          <option value="Failed">Failed</option>
          <option value="Open">Open</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700/50">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700/50 bg-slate-800/80">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-400">Ticket ID</th>
              <th className="px-4 py-3 font-medium text-slate-400">Summary</th>
              <th className="px-4 py-3 font-medium text-slate-400">Status</th>
              <th className="px-4 py-3 font-medium text-slate-400">Agent Status</th>
              <th className="px-4 py-3 font-medium text-slate-400">Confidence</th>
              <th className="px-4 py-3 font-medium text-slate-400">PR</th>
              <th className="px-4 py-3 font-medium text-slate-400">Environment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading tickets...
                </td>
              </tr>
            )}
            {!loading && filtered.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} />
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No tickets match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  return (
    <tr className="bg-slate-800/30 transition-colors hover:bg-slate-800/60">
      <td className="px-4 py-3">
        <Link
          href={`/tickets/${ticket.id}`}
          className="font-medium text-blue-400 hover:text-blue-300"
        >
          {ticket.id}
        </Link>
      </td>
      <td className="max-w-xs truncate px-4 py-3 text-slate-300">
        {ticket.summary}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={ticket.status} />
      </td>
      <td className="px-4 py-3 text-slate-400">{ticket.agentStatus}</td>
      <td className="px-4 py-3">
        <ConfidenceBar value={ticket.confidence} />
      </td>
      <td className="px-4 py-3">
        {ticket.pr ? (
          <span className="text-blue-400">{ticket.pr}</span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-slate-400">{ticket.environment}</td>
    </tr>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 90
      ? "bg-emerald-500"
      : value >= 70
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-slate-400">{value}%</span>
    </div>
  );
}
