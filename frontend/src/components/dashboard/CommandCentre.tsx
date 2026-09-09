"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/common/Button";
import {
  getTenantWorkspace,
  runWorkflowStage,
  type TenantWorkspace,
} from "@/services/tenants";

const PHASES = [
  { id: "triage", label: "Triage" },
  { id: "investigate", label: "Investigate" },
  { id: "plan", label: "Plan" },
  { id: "code", label: "Code" },
  { id: "test", label: "Test" },
  { id: "deploy_dev", label: "DEV deploy" },
  { id: "validate_dev", label: "DEV validate" },
  { id: "create_pr", label: "Create PR" },
  { id: "review_pr", label: "PR review" },
  { id: "human_approval", label: "Human approval" },
  { id: "merge", label: "Merge" },
  { id: "deploy_prod", label: "PROD deploy" },
  { id: "validate_prod", label: "PROD validate" },
  { id: "update_ticket", label: "Update ticket" },
  { id: "notify", label: "Notify" },
] as const;

export function CommandCentre() {
  const [ws, setWs] = useState<TenantWorkspace | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [last, setLast] = useState<string>("");

  useEffect(() => {
    getTenantWorkspace().then(setWs);
  }, []);

  async function runStage(stageId: string) {
    setRunning(stageId);
    setLast("");
    try {
      const result = await runWorkflowStage(stageId);
      setLast(`${stageId}: ${result.status} (${result.runId})`);
    } catch (err) {
      setLast(`${stageId}: failed — ${err instanceof Error ? err.message : "error"}`);
    } finally {
      setRunning(null);
    }
  }

  const skillCount = ws?.skills.length ?? 0;
  const ruleCount = ws?.rules.length ?? 0;
  const nodeCount = ws?.lineage.nodes?.length ?? 0;
  const secretOk = Object.values(ws?.secretsConfigured ?? {}).filter(Boolean).length;

  return (
    <section className="mb-8 rounded-xl border border-slate-700/50 bg-slate-900/40 p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">
            {ws?.name ?? "Tenant"} · Jira to production
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Run one phase at a time. Creds come from this tenant&apos;s secrets file — no retyping.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <Link href="/skills" className="rounded-md border border-slate-700 px-2 py-1 text-slate-300">
            {skillCount} skills
          </Link>
          <span className="rounded-md border border-slate-700 px-2 py-1 text-slate-300">
            {ruleCount} rules
          </span>
          <Link href="/lineage" className="rounded-md border border-slate-700 px-2 py-1 text-slate-300">
            {nodeCount} lineage nodes
          </Link>
          <Link href="/reports" className="rounded-md border border-slate-700 px-2 py-1 text-slate-300">
            Production reports
          </Link>
          <span className="rounded-md border border-slate-700 px-2 py-1 text-slate-300">
            {secretOk} secret packs
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PHASES.map((phase) => (
          <Button
            key={phase.id}
            type="button"
            variant="secondary"
            size="sm"
            disabled={running !== null}
            onClick={() => runStage(phase.id)}
          >
            {running === phase.id ? (
              "…"
            ) : (
              <span className="inline-flex items-center gap-1">
                <Play className="h-3 w-3" />
                {phase.label}
              </span>
            )}
          </Button>
        ))}
      </div>
      {last && <p className="mt-3 text-xs text-sky-300">{last}</p>}
    </section>
  );
}
