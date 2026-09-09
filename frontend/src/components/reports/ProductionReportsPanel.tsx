"use client";

import { useEffect, useState } from "react";
import { getTenantWorkspace, type TenantWorkspace } from "@/services/tenants";

export function ProductionReportsPanel() {
  const [ws, setWs] = useState<TenantWorkspace | null>(null);

  useEffect(() => {
    getTenantWorkspace().then(setWs);
  }, []);

  const checks = ws?.productionReports.checks ?? [];

  return (
    <div className="mb-8 rounded-xl border border-slate-700/50 bg-slate-900/40 p-5">
      <h2 className="text-lg font-semibold text-white">
        Production reports · {ws?.name ?? "tenant"}
      </h2>
      <p className="mt-1 text-sm text-slate-400">{ws?.productionReports.note}</p>
      {checks.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No production checks stored for this tenant yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {checks.map((c) => (
            <li key={c.id} className="flex justify-between">
              <span>{c.name}</span>
              <span className="text-slate-500">{c.status ?? "pending"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
