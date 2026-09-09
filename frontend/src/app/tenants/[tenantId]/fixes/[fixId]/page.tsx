"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArtefactViewer } from "@/components/tenants/ArtefactViewer";
import { TicketChecklist } from "@/components/tenants/TicketChecklist";
import { getTenantFix, type FixItem } from "@/services/tenants";
import { getClientTheme } from "@/lib/clientThemes";

export default function ClientFixDetailPage() {
  const params = useParams<{ tenantId: string; fixId: string }>();
  const { tenantId, fixId } = params;
  const theme = getClientTheme(tenantId);
  const [fix, setFix] = useState<FixItem | null>(null);

  function reload() {
    getTenantFix(tenantId, fixId).then(setFix);
  }

  useEffect(() => {
    reload();
  }, [tenantId, fixId]);

  if (!fix) {
    return <p style={{ color: theme.muted }}>Loading ticket studio…</p>;
  }

  const badges = [
    fix.status,
    fix.pipeline_stage,
    fix.has_proposed_solution ? "solution" : null,
    fix.has_triage ? "triage" : null,
  ].filter(Boolean) as string[];

  return (
    <div
      className="flex flex-col gap-3"
      style={{ minHeight: "calc(100vh - 6.5rem)" }}
    >
      {/* Hero strip */}
      <div
        className="relative overflow-hidden rounded-xl border px-4 py-3"
        style={{
          borderColor: theme.railBorder,
          background: `linear-gradient(120deg, ${theme.surface} 0%, ${theme.surfaceAlt} 55%, ${theme.accentSoft} 100%)`,
        }}
      >
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link
              href={`/tenants/${tenantId}/fixes`}
              className="text-[11px]"
              style={{ color: theme.muted }}
            >
              ← All fixes
            </Link>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <h1
                className="text-2xl font-semibold tracking-tight"
                style={{ color: theme.text }}
              >
                {fix.jira}
              </h1>
              <span className="text-sm" style={{ color: theme.muted }}>
                {fix.dimension}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span
                  key={b}
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                  style={{ background: theme.chip, color: theme.muted }}
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
          <p
            className="max-w-xs text-right text-[11px] leading-snug"
            style={{ color: theme.muted }}
          >
            Ticket studio — runway on top, docs centre stage. Run a phase, then
            read Brief / Solution / Evidence / Ops.
          </p>
        </div>
      </div>

      {/* Runway first */}
      <TicketChecklist tenantId={tenantId} fixId={fixId} onUpdated={reload} />

      {/* Docs fill the rest */}
      <div className="min-h-0 flex-1">
        <ArtefactViewer
          tenantId={tenantId}
          fixId={fixId}
          artefacts={fix.artefacts || []}
          fillHeight
        />
      </div>
    </div>
  );
}
