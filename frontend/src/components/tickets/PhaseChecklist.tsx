"use client";

import { useEffect, useState } from "react";
import { Check, Play } from "lucide-react";
import { getWorkflows } from "@/services/platform";
import { runWorkflowStage } from "@/services/tenants";
import type { WorkflowDefinition, WorkflowPhase } from "@/types";

interface PhaseChecklistProps {
  ticketStatus: string;
  ticketId?: string;
}

export function PhaseChecklist({ ticketStatus, ticketId }: PhaseChecklistProps) {
  const [phases, setPhases] = useState<WorkflowPhase[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [last, setLast] = useState("");

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

  async function runPhase(phase: WorkflowPhase) {
    setRunning(phase.id);
    setLast("");
    try {
      const result = await runWorkflowStage(phase.id, ticketId);
      setLast(`${phase.name}: ${result.status}`);
    } catch (err) {
      setLast(`${phase.name}: ${err instanceof Error ? err.message : "failed"}`);
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Jira phased checklist
      </h3>
      <p className="mb-3 text-xs text-slate-500">
        Run one phase. Tenant secrets are applied automatically.
      </p>
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
              <p className={`flex-1 text-sm font-medium ${idx <= activePhaseIndex ? "text-white" : "text-slate-500"}`}>
                {phase.name}
              </p>
              <button
                type="button"
                disabled={running !== null}
                onClick={() => runPhase(phase)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                <Play className="h-3 w-3" />
                {running === phase.id ? "Running" : "Run"}
              </button>
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
      {last && <p className="mt-3 text-xs text-sky-300">{last}</p>}
    </div>
  );
}
