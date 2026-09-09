"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LineageGraph } from "@/components/tenants/LineageGraph";
import { getClientDashboard, type ClientDashboard } from "@/services/tenants";
import { getClientTheme } from "@/lib/clientThemes";

export default function ClientLineagePage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const theme = getClientTheme(tenantId);
  const [dash, setDash] = useState<ClientDashboard | null>(null);

  useEffect(() => {
    getClientDashboard(tenantId).then(setDash);
  }, [tenantId]);

  return (
    <div
      className="flex min-h-0 flex-col gap-3"
      style={{ minHeight: "calc(100vh - 7rem)" }}
    >
      <header className="shrink-0">
        <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
          Data lineage
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: theme.muted }}>
          {dash?.lineage?.note ||
            "Gold ← Iceberg curated ← raw feeds (per dimension)."}
        </p>
      </header>
      <div className="min-h-0 flex-1">
        <LineageGraph tenantId={tenantId} lineage={dash?.lineage || null} />
      </div>
    </div>
  );
}
