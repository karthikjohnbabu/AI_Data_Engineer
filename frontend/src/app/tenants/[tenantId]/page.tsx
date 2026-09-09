"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MetricTile } from "@/components/tenants/MetricTile";
import { LineageGraph } from "@/components/tenants/LineageGraph";
import { getClientDashboard, type ClientDashboard } from "@/services/tenants";
import { getClientTheme } from "@/lib/clientThemes";

export default function ClientOverviewPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const theme = getClientTheme(tenantId);
  const [dash, setDash] = useState<ClientDashboard | null>(null);

  useEffect(() => {
    getClientDashboard(tenantId).then(setDash);
  }, [tenantId]);

  if (!dash) {
    return <p style={{ color: theme.muted }}>Loading workspace…</p>;
  }

  const m = dash.metrics;

  return (
    <div className="space-y-8">
      <section>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: theme.accent }}
        >
          Overview
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight" style={{ color: theme.text }}>
          What&apos;s going on
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: theme.muted }}>
          Tickets, pipeline, fixes, lineage and production reports for{" "}
          <strong style={{ color: theme.text }}>{dash.name}</strong> — one place,
          tenant-isolated.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile tenantId={tenantId} label="Tickets" value={m.ticketsTotal} hint={`${m.ticketsDone} fixed`} />
        <MetricTile tenantId={tenantId} label="In pipeline" value={m.ticketsInPipeline} />
        <MetricTile tenantId={tenantId} label="Skills / rules" value={`${m.skills} / ${m.rules}`} />
        <MetricTile
          tenantId={tenantId}
          label="Proposed solutions"
          value={m.proposedSolutions}
          hint={`${m.lineageNodes} lineage nodes`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {dash.pipeline.map((col) => (
          <div
            key={col.stage}
            className="rounded-2xl border p-5"
            style={{ borderColor: theme.railBorder, background: theme.surface }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: theme.text }}>
                {col.label}
              </h2>
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ background: theme.chip, color: theme.muted }}
              >
                {col.count}
              </span>
            </div>
            <div className="space-y-2">
              {col.items.length === 0 && (
                <p className="text-sm" style={{ color: theme.muted }}>
                  None
                </p>
              )}
              {col.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/tenants/${tenantId}/fixes/${item.id}`}
                  className="block rounded-xl border px-3 py-2.5 transition hover:opacity-90"
                  style={{ borderColor: theme.railBorder, background: theme.surfaceAlt }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium" style={{ color: theme.text }}>
                      {item.jira}
                    </span>
                    <span className="text-[11px]" style={{ color: theme.muted }}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs" style={{ color: theme.muted }}>
                    {item.dimension}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section
        className="rounded-2xl border p-5"
        style={{ borderColor: theme.railBorder, background: theme.surface }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: theme.text }}>
            Data lineage
          </h2>
          <Link
            href={`/tenants/${tenantId}/lineage`}
            className="text-xs font-medium"
            style={{ color: theme.accent }}
          >
            Full graph
          </Link>
        </div>
        <LineageGraph tenantId={tenantId} lineage={dash.lineage || null} />
      </section>

      <section
        className="rounded-2xl border p-5"
        style={{ borderColor: theme.railBorder, background: theme.surface }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: theme.text }}>
            Production reports
          </h2>
          <Link
            href={`/tenants/${tenantId}/reports`}
            className="text-xs font-medium"
            style={{ color: theme.accent }}
          >
            All reports
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {(dash.productionReports.checks || []).map((c) => (
            <div
              key={c.id}
              className="rounded-xl border px-3 py-3"
              style={{ borderColor: theme.railBorder, background: theme.surfaceAlt }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium" style={{ color: theme.text }}>
                  {c.name}
                </p>
                <StatusChip tenantId={tenantId} status={c.status || "pending"} />
              </div>
              {c.ticket && (
                <p className="mt-1 text-xs" style={{ color: theme.muted }}>
                  {c.ticket}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatusChip({ tenantId, status }: { tenantId: string; status: string }) {
  const theme = getClientTheme(tenantId);
  const tone =
    status === "pass"
      ? "#34d399"
      : status === "blocked" || status === "failed"
        ? "#f87171"
        : status === "warn"
          ? "#fbbf24"
          : theme.accent;
  return (
    <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: tone, background: theme.chip }}>
      {status}
    </span>
  );
}
