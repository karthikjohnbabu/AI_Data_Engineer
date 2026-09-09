"use client";

import { getClientTheme } from "@/lib/clientThemes";

export function MetricTile({
  tenantId,
  label,
  value,
  hint,
}: {
  tenantId: string;
  label: string;
  value: string | number;
  hint?: string;
}) {
  const theme = getClientTheme(tenantId);
  return (
    <div
      className="rounded-2xl border p-4 shadow-sm"
      style={{ borderColor: theme.railBorder, background: theme.surface }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: theme.muted }}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight" style={{ color: theme.text }}>
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs" style={{ color: theme.muted }}>
          {hint}
        </p>
      )}
    </div>
  );
}
