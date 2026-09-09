"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownRight,
  Coins,
  Gauge,
  Layers,
  Sparkles,
} from "lucide-react";
import { getClientTheme } from "@/lib/clientThemes";
import {
  getTenantCostControl,
  type CostControlOverview,
} from "@/services/tenants";

const PLACEHOLDER_FOCUS = [
  {
    id: "glue",
    title: "Glue / ETL spend",
    blurb: "Worker hours, DPU, idle interactive sessions.",
  },
  {
    id: "storage",
    title: "Lake & warehouse storage",
    blurb: "S3 growth, Iceberg snapshots, Redshift unused tables.",
  },
  {
    id: "compute",
    title: "Query & warehouse compute",
    blurb: "Athena / Spectrum / cluster utilisation windows.",
  },
  {
    id: "guardrails",
    title: "Budget guardrails",
    blurb: "Alerts and hard caps before month-end surprise bills.",
  },
];

export default function CostControlPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const theme = getClientTheme(tenantId);
  const [data, setData] = useState<CostControlOverview | null>(null);

  useEffect(() => {
    getTenantCostControl(tenantId).then(setData);
  }, [tenantId]);

  const status = data?.status || "placeholder";
  const focus = data?.focusAreas?.length ? data.focusAreas : PLACEHOLDER_FOCUS;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: theme.accent }}
          >
            <Coins className="h-3.5 w-3.5" />
            FinOps
          </p>
          <h1
            className="mt-1 text-2xl font-semibold tracking-tight"
            style={{ color: theme.text }}
          >
            Cost Control
          </h1>
          <p className="mt-1 max-w-2xl text-sm" style={{ color: theme.muted }}>
            {data?.summary ||
              "Placeholder for cloud spend visibility and reduction — most teams overspend on ETL, storage, and idle compute. This tenant slot is ready for budgets, anomalies, and savings plays."}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{ background: theme.chip, color: theme.accent }}
        >
          {status}
        </span>
      </header>

      <section
        className="overflow-hidden rounded-2xl border p-5"
        style={{
          borderColor: theme.railBorder,
          background: `linear-gradient(135deg, ${theme.surface} 0%, ${theme.surfaceAlt} 100%)`,
        }}
      >
        <div className="flex flex-wrap items-start gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: theme.accentSoft, color: theme.accent }}
          >
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
              Coming soon for {data?.title || tenantId}
            </h2>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: theme.muted }}>
              Wire AWS Cost Explorer / CUR, Glue job run costs, and warehouse
              metrics here. Until then this page holds the product slot so every
              tenant portal has the same Cost Control entry point.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          theme={theme}
          icon={Gauge}
          label="Month to date"
          value={data?.metrics?.monthToDate || "—"}
          hint="Not connected"
        />
        <Metric
          theme={theme}
          icon={ArrowDownRight}
          label="Savings opportunity"
          value={data?.metrics?.savingsOpportunity || "—"}
          hint="Estimate later"
        />
        <Metric
          theme={theme}
          icon={AlertTriangle}
          label="Anomalies"
          value={String(data?.metrics?.anomalies ?? "—")}
          hint="Watch list"
        />
        <Metric
          theme={theme}
          icon={Layers}
          label="Budgets"
          value={String(data?.metrics?.budgetsConfigured ?? 0)}
          hint="Configure later"
        />
      </section>

      <section>
        <h3
          className="mb-3 text-sm font-semibold"
          style={{ color: theme.text }}
        >
          Planned focus areas
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {focus.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border p-4"
              style={{
                borderColor: theme.railBorder,
                background: theme.surface,
              }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: theme.text }}
              >
                {item.title}
              </p>
              <p className="mt-1 text-sm" style={{ color: theme.muted }}>
                {item.blurb}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({
  theme,
  icon: Icon,
  label,
  value,
  hint,
}: {
  theme: ReturnType<typeof getClientTheme>;
  icon: typeof Gauge;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: theme.railBorder, background: theme.surface }}
    >
      <div className="flex items-center gap-2" style={{ color: theme.muted }}>
        <Icon className="h-4 w-4" style={{ color: theme.accent }} />
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold" style={{ color: theme.text }}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px]" style={{ color: theme.muted }}>
        {hint}
      </p>
    </div>
  );
}
