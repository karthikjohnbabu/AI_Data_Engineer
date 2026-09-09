"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SkillsManager } from "@/components/tenants/SkillsManager";
import {
  getClientDashboard,
  type ClientDashboard,
} from "@/services/tenants";
import { getClientTheme } from "@/lib/clientThemes";

export default function ClientSkillsPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const theme = getClientTheme(tenantId);
  const [dash, setDash] = useState<ClientDashboard | null>(null);

  const reload = useCallback(() => {
    getClientDashboard(tenantId).then(setDash);
  }, [tenantId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="space-y-6">
      <header>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: theme.accent }}
        >
          Tenant skills
        </p>
        <h1 className="mt-1 text-2xl font-semibold" style={{ color: theme.text }}>
          Skills
        </h1>
        <p className="mt-1 max-w-2xl text-sm" style={{ color: theme.muted }}>
          Standard + tenant packs for this workspace. Download / upload zip
          packs here — same capability as Admin.
        </p>
      </header>

      <SkillsManager
        tenantId={tenantId}
        skills={dash?.skills || []}
        variant="tenant"
        onChanged={reload}
      />
    </div>
  );
}
