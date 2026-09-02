"use client";

import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { getPendingActions, resolvePendingAction } from "@/services/platform";
import type { PendingAction } from "@/types";

export function PendingActionsPanel() {
  const [actions, setActions] = useState<PendingAction[]>([]);

  useEffect(() => {
    getPendingActions().then(setActions);
    const interval = setInterval(() => getPendingActions().then(setActions), 15000);
    return () => clearInterval(interval);
  }, []);

  if (actions.length === 0) return null;

  async function handleResolve(id: string, approved: boolean) {
    await resolvePendingAction(id, approved);
    setActions((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
        <Bell className="h-4 w-4" />
        Human-in-the-loop — approval required ({actions.length})
      </div>
      {actions.map((action) => (
        <div
          key={action.id}
          className="flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/10 p-4"
        >
          <div>
            <p className="text-sm font-medium text-white">
              [{action.source}] {action.action}
            </p>
            <p className="mt-1 text-sm text-slate-400">{action.message}</p>
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
