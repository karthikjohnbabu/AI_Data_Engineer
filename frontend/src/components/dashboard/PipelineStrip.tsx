"use client";

import Link from "next/link";

const PIPELINE = [
  "Jira / Teams / Slack",
  "Triage",
  "Investigation",
  "Planner",
  "Coding",
  "Feature Branch",
  "Tests",
  "DEV Deploy",
  "DEV Validation",
  "Create PR",
  "PR Review",
  "Human Approval",
  "Merge",
  "PROD Deploy",
  "PROD Validation",
  "Learn & Close",
] as const;

export function PipelineStrip({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "overflow-x-auto pb-1" : "overflow-x-auto"}>
      <div className="flex min-w-max items-center gap-1.5">
        {PIPELINE.map((step, index) => (
          <div key={step} className="flex items-center gap-1.5">
            <div
              className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium tracking-wide ${
                step === "Human Approval"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                  : "border-slate-700/80 bg-slate-900/80 text-slate-300"
              }`}
            >
              {step}
            </div>
            {index < PIPELINE.length - 1 && (
              <span className="text-slate-600" aria-hidden>
                →
              </span>
            )}
          </div>
        ))}
      </div>
      {!compact && (
        <p className="mt-3 text-xs text-slate-500">
          Engineers approve critical actions.{" "}
          <Link href="/approvals" className="text-sky-400 hover:text-sky-300">
            Open approvals
          </Link>
        </p>
      )}
    </div>
  );
}
