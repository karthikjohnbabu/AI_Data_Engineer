import type { TimelineStep } from "@/types";
import { Check, Circle, Loader2, X } from "lucide-react";
import { cn, formatDate } from "@/utils";

interface ExecutionTimelineProps {
  steps: TimelineStep[];
}

function StepIcon({ status }: { status: TimelineStep["status"] }) {
  switch (status) {
    case "completed":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20">
          <Check className="h-4 w-4 text-emerald-400" />
        </div>
      );
    case "in_progress":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20">
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
        </div>
      );
    case "failed":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20">
          <X className="h-4 w-4 text-red-400" />
        </div>
      );
    default:
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700/50">
          <Circle className="h-3 w-3 text-slate-500" />
        </div>
      );
  }
}

export function ExecutionTimeline({ steps }: ExecutionTimelineProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => (
        <div key={step.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <StepIcon status={step.status} />
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-0.5 flex-1 min-h-[2rem]",
                  step.status === "completed"
                    ? "bg-emerald-500/30"
                    : "bg-slate-700"
                )}
              />
            )}
          </div>
          <div className="pb-6">
            <p
              className={cn(
                "text-sm font-medium",
                step.status === "completed"
                  ? "text-white"
                  : step.status === "in_progress"
                    ? "text-amber-400"
                    : "text-slate-500"
              )}
            >
              {step.label}
            </p>
            {step.description && (
              <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
            )}
            {step.timestamp && (
              <p className="mt-1 text-xs text-slate-600">
                {formatDate(step.timestamp)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
