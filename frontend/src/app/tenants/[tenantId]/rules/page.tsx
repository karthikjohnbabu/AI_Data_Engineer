"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getClientDashboard, type ClientDashboard } from "@/services/tenants";
import { getClientTheme } from "@/lib/clientThemes";

export default function ClientRulesPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const theme = getClientTheme(tenantId);
  const [dash, setDash] = useState<ClientDashboard | null>(null);

  useEffect(() => {
    getClientDashboard(tenantId).then(setDash);
  }, [tenantId]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
          Rules
        </h1>
        <p className="mt-1 text-sm" style={{ color: theme.muted }}>
          Guardrails for this tenant only.
        </p>
      </header>
      <div className="space-y-2">
        {(dash?.rules || []).map((r) => (
          <div
            key={r.id}
            className="rounded-xl border px-4 py-3"
            style={{ borderColor: theme.railBorder, background: theme.surface }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium" style={{ color: theme.text }}>
                  {r.name}
                </p>
                <p className="text-[11px]" style={{ color: theme.muted }}>
                  {r.id}
                </p>
              </div>
              {r.requireHumanApproval && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px]"
                  style={{ background: theme.accentSoft, color: theme.accent }}
                >
                  human approval
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
