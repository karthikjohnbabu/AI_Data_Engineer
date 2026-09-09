"use client";

import { useEffect, useState } from "react";
import { getTenantId, setTenantId } from "@/services/api";
import { listTenants, type TenantListItem } from "@/services/tenants";

export function TenantSwitcher() {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [current, setCurrent] = useState("newton");

  useEffect(() => {
    setCurrent(getTenantId());
    listTenants().then((res) => setTenants(res.tenants));
  }, []);

  function onChange(tenantId: string) {
    setTenantId(tenantId);
    setCurrent(tenantId);
    window.location.reload();
  }

  if (tenants.length === 0) {
    return (
      <span className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-400">
        Tenant: {current}
      </span>
    );
  }

  return (
    <label className="inline-flex items-center gap-2 text-xs text-slate-400">
      Tenant
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200"
      >
        {tenants.map((t) => (
          <option key={t.tenantId} value={t.tenantId}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
