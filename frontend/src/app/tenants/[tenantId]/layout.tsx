"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClientShell } from "@/components/tenants/ClientShell";
import { getClientDashboard, type ClientDashboard } from "@/services/tenants";
import { setTenantId } from "@/services/api";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const [dash, setDash] = useState<ClientDashboard | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    setTenantId(tenantId);
    getClientDashboard(tenantId).then(setDash);
  }, [tenantId]);

  return (
    <ClientShell tenantId={tenantId} tenantName={dash?.name || tenantId}>
      {children}
    </ClientShell>
  );
}
