"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getRuns } from "@/services/runs";
import type { AgentRun } from "@/types";
import { formatDate } from "@/utils";

export default function RunsPage() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRuns()
      .then(setRuns)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Runs"
        description="Agent execution history across all tickets"
      />

      <div className="overflow-hidden rounded-xl border border-slate-700/50">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700/50 bg-slate-800/80">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-400">Ticket</th>
              <th className="px-4 py-3 font-medium text-slate-400">Classification</th>
              <th className="px-4 py-3 font-medium text-slate-400">Severity</th>
              <th className="px-4 py-3 font-medium text-slate-400">Confidence</th>
              <th className="px-4 py-3 font-medium text-slate-400">Status</th>
              <th className="px-4 py-3 font-medium text-slate-400">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading runs...
                </td>
              </tr>
            )}
            {!loading && runs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No agent runs yet. Open a ticket and click &quot;Run Again&quot; to start.
                </td>
              </tr>
            )}
            {!loading &&
              runs.map((run) => (
                <tr key={run.ticketId} className="bg-slate-800/30 hover:bg-slate-800/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/tickets/${run.ticketId}`}
                      className="font-medium text-blue-400 hover:text-blue-300"
                    >
                      {run.ticketId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{run.classification}</td>
                  <td className="px-4 py-3 text-slate-400">{run.severity}</td>
                  <td className="px-4 py-3 text-slate-400">{run.confidence}%</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {run.completedAt ? formatDate(run.completedAt) : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
