import { cn } from "@/utils";

const statusStyles: Record<string, string> = {
  Done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "In Progress": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "In Review": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Failed: "bg-red-500/15 text-red-400 border-red-500/30",
  Open: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  passed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  skipped: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  inactive: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  pending: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        style,
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
