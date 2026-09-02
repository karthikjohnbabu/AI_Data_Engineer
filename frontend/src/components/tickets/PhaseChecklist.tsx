"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { getWorkflows } from "@/services/platform";
import type { WorkflowDefinition, WorkflowPhase } from "@/types";

interface PhaseChecklistProps {
  ticketStatus: string;
}

export function PhaseChecklist({ ticketStatus }: PhaseChecklistProps) {
  const [phases, setPhases] = useState<WorkflowPhase[]>([]);

  useEffect(() => {
    getWorkflows().then((wfs) => {
      const defaultWf = wfs.find((w) => !w.custom) ?? wfs[0];
      if (defaultWf) setPhases(defaultWf.phases);
    });
  }, []);

  if (phases.length === 0) return null;

  const activePhaseIndex =
    ticketStatus === "Done" ? 3
      : ticketStatus === "In Review" ? 2
        : ticketStatus === "In Progress" ? 1
          : 0;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Jira Phased Checklist
      </h3>
      <div className="space-y-4">
        {phases.map((phase, idx) => (
          <div key={phase.id}>
            <div className="flex items-center gap-2">
              {idx < activePhaseIndex ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              ) : idx === activePhaseIndex ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                  {idx + 1}
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-500">
                  {idx + 1}
                </div>
              )}
              <p className={`text-sm font-medium ${idx <= activePhaseIndex ? "text-white" : "text-slate-500"}`}>
                {phase.name}
              </p>
            </div>
            {idx === activePhaseIndex && (
              <ul className="ml-8 mt-2 space-y-1">
                {phase.tasks.map((task) => (
                  <li key={task} className="text-xs text-slate-400">• {task}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
