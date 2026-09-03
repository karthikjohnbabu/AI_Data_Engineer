"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPullRequests, type PullRequestItem } from "@/services/pullRequests";
import { StatusBadge } from "@/components/common/StatusBadge";

export function PullRequestsTable() {
  const [prs, setPrs] = useState<PullRequestItem[]>([]);

  useEffect(() => {
    getPullRequests().then(setPrs);
  }, []);

  if (prs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
        No pull requests yet. Run a ticket through Newton to generate a PR after DEV validation.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/50">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">PR</th>
            <th className="px-4 py-3 font-medium">Ticket</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Confidence</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-950/40">
          {prs.map((pr) => (
            <tr key={pr.id} className="hover:bg-slate-900/60">
              <td className="px-4 py-3 font-mono text-slate-300">{pr.id}</td>
              <td className="px-4 py-3">
                <Link href={`/tickets/${pr.ticketId}`} className="text-sky-400 hover:text-sky-300">
                  {pr.ticketId}
                </Link>
              </td>
              <td className="px-4 py-3 text-white">{pr.title}</td>
              <td className="px-4 py-3 text-slate-300">{pr.confidence}%</td>
              <td className="px-4 py-3">
                <StatusBadge status={pr.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
