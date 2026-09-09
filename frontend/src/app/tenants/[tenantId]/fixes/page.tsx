"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { listTenantFixes, type FixItem } from "@/services/tenants";
import { getClientTheme } from "@/lib/clientThemes";

export default function ClientFixesPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const theme = getClientTheme(tenantId);
  const [fixes, setFixes] = useState<FixItem[]>([]);

  useEffect(() => {
    listTenantFixes(tenantId).then(setFixes);
  }, [tenantId]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
          Fixes
        </h1>
        <p className="mt-1 text-sm" style={{ color: theme.muted }}>
          Proposed solutions, triage, PR drafts and validation notes — readable in-app.
        </p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {fixes.map((f) => (
          <Link
            key={f.id}
            href={`/tenants/${tenantId}/fixes/${f.id}`}
            className="rounded-2xl border p-5 transition hover:opacity-95"
            style={{ borderColor: theme.railBorder, background: theme.surface }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold" style={{ color: theme.accent }}>
                  {f.jira}
                </p>
                <h2 className="mt-1 text-lg font-semibold" style={{ color: theme.text }}>
                  {f.dimension}
                </h2>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[11px]"
                style={{ background: theme.chip, color: theme.muted }}
              >
                {f.status}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {f.has_proposed_solution && (
                <Chip tenantId={tenantId} label="proposed solution" />
              )}
              {f.has_triage && <Chip tenantId={tenantId} label="triage" />}
              <Chip tenantId={tenantId} label={`${(f.artefacts || []).length} files`} />
            </div>
            <div className="mt-3 flex gap-3 text-[11px]">
              <span style={{ color: theme.accent }}>Open studio →</span>
            </div>
          </Link>
        ))}
      </div>
      <p className="text-xs" style={{ color: theme.muted }}>
        Also under Fixes:{" "}
        <Link href={`/tenants/${tenantId}/fixes/checklist`} style={{ color: theme.accent }}>
          Checklist
        </Link>{" "}
        ·{" "}
        <Link href={`/tenants/${tenantId}/fixes/results`} style={{ color: theme.accent }}>
          Results
        </Link>
      </p>
    </div>
  );
}

function Chip({ tenantId, label }: { tenantId: string; label: string }) {
  const theme = getClientTheme(tenantId);
  return (
    <span className="rounded-md px-2 py-1 text-[11px]" style={{ background: theme.chip, color: theme.muted }}>
      {label}
    </span>
  );
}
