"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getClientDashboard, type ClientDashboard } from "@/services/tenants";
import { getClientTheme } from "@/lib/clientThemes";

export default function ClientReportsPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const theme = getClientTheme(tenantId);
  const [dash, setDash] = useState<ClientDashboard | null>(null);

  useEffect(() => {
    getClientDashboard(tenantId).then(setDash);
  }, [tenantId]);

  const reports = dash?.productionReports;
  const powerbi = reports?.powerbi || [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
          Power BI reports
        </h1>
        <p className="mt-1 text-sm" style={{ color: theme.muted }}>
          {reports?.note ||
            "Published and draft Power BI workspaces bound to gold models."}
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {powerbi.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border p-4"
            style={{ borderColor: theme.railBorder, background: theme.surface }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs uppercase tracking-wide" style={{ color: theme.muted }}>
                {r.type || "report"} · {r.workspace}
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-[11px]"
                style={{ background: theme.chip, color: theme.accent }}
              >
                {r.status}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-semibold" style={{ color: theme.text }}>
              {r.name}
            </h2>
            <p className="mt-1 text-sm" style={{ color: theme.muted }}>
              {r.description}
            </p>
            <p className="mt-3 text-[11px]" style={{ color: theme.muted }}>
              Dataset · {r.dataset} · Owner · {r.owner}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(r.pages || []).map((p) => (
                <span
                  key={p}
                  className="rounded-md px-2 py-0.5 text-[11px]"
                  style={{ background: theme.navActiveBg, color: theme.text }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        ))}
        {powerbi.length === 0 && (
          <p className="text-sm" style={{ color: theme.muted }}>
            No Power BI samples yet for this tenant.
          </p>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold" style={{ color: theme.text }}>
          Validation windows
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(reports?.windows || []).map((w) => (
            <div
              key={w.id}
              className="rounded-2xl border p-4"
              style={{ borderColor: theme.railBorder, background: theme.surface }}
            >
              <p className="text-xs uppercase tracking-wide" style={{ color: theme.muted }}>
                Window
              </p>
              <p className="mt-1 text-lg font-semibold" style={{ color: theme.text }}>
                {w.label || w.id}
              </p>
              <p className="mt-1 text-xs" style={{ color: theme.accent }}>
                {w.status}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: theme.railBorder, background: theme.surface }}
      >
        <table className="w-full text-left text-sm">
          <thead style={{ background: theme.surfaceAlt, color: theme.muted }}>
            <tr className="text-[11px] uppercase tracking-wide">
              <th className="px-4 py-3">Parity check</th>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(reports?.checks || []).map((c) => (
              <tr
                key={c.id}
                className="border-t"
                style={{ borderColor: theme.railBorder, color: theme.text }}
              >
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3" style={{ color: theme.muted }}>
                  {c.ticket || "—"}
                </td>
                <td className="px-4 py-3" style={{ color: theme.accent }}>
                  {c.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
