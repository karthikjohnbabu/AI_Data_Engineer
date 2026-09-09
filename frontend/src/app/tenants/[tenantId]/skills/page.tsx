"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getClientDashboard, type ClientDashboard } from "@/services/tenants";
import { getClientTheme } from "@/lib/clientThemes";

export default function ClientSkillsPage() {
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
          Skills
        </h1>
        <p className="mt-1 text-sm" style={{ color: theme.muted }}>
          Tenant work skills (overrides + standard).
        </p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {(dash?.skills || []).map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border p-4"
            style={{ borderColor: theme.railBorder, background: theme.surface }}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold" style={{ color: theme.text }}>
                {s.name}
              </h2>
              <span className="text-[11px]" style={{ color: theme.muted }}>
                {s.source}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.muted }}>
              {s.description || s.id}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
