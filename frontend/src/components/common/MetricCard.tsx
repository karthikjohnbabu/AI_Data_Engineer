import { cn } from "@/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  className,
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const isNegativeGood = changeLabel?.includes("decrease");

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-700/50 bg-slate-800/50 p-5",
        className
      )}
    >
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-white">
        {value}
      </p>
      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1 text-sm">
          {(isPositive && !isNegativeGood) || (!isPositive && isNegativeGood) ? (
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-emerald-400" />
          )}
          <span className="text-emerald-400">
            {change > 0 ? "+" : ""}
            {change}%
          </span>
          {changeLabel && (
            <span className="text-slate-500">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
