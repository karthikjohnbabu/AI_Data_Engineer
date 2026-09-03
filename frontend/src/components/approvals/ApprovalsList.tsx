"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { decideApproval, getApprovals } from "@/services/approvals";
import type { PendingAction } from "@/types";

export function ApprovalsList() {
  const [actions, setActions] = useState<PendingAction[]>([]);

  useEffect(() => {
    getApprovals().then(setActions);
  }, []);

  async function handleResolve(id: string, approved: boolean) {
    await decideApproval(id, approved);
    setActions((prev) => prev.filter((a) => a.id !== id));
  }

  if (actions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
        No pending approvals. Newton will pause here when critical actions need an engineer.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <div
          key={action.id}
          className="flex flex-col gap-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-medium text-white">
              [{action.source}] {action.action}
            </p>
            <p className="mt-1 text-sm text-slate-400">{action.message}</p>
            {action.ticket_id && (
              <Link
                href={`/tickets/${action.ticket_id}`}
                className="mt-2 inline-block text-xs text-sky-400 hover:text-sky-300"
              >
                Open {action.ticket_id}
              </Link>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="success" onClick={() => handleResolve(action.id, true)}>
              <Check className="h-3 w-3" /> Approve
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleResolve(action.id, false)}>
              <X className="h-3 w-3" /> Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
