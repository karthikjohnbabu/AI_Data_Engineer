"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { useEffect, useState } from "react";
import { getTenantWorkspace, type TenantWorkspace } from "@/services/tenants";

export default function LineagePage() {
  const [ws, setWs] = useState<TenantWorkspace | null>(null);

  useEffect(() => {
    getTenantWorkspace().then(setWs);
  }, []);

  const nodes = ws?.lineage.nodes ?? [];
  const edges = ws?.lineage.edges ?? [];

  return (
    <div>
      <PageHeader
        title="Lineage"
        description="Tenant-local graph only. No warehouse dumps from other tenants."
      />
      <p className="mb-4 text-sm text-slate-400">{ws?.lineage.note}</p>
      {nodes.length === 0 ? (
        <p className="text-sm text-slate-500">
          No lineage nodes yet for {ws?.name ?? "this tenant"}. Add them under
          tenant_data/&lt;tenant&gt;/lineage/catalog.yaml.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-5">
            <h2 className="mb-3 text-sm font-semibold text-white">Nodes</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              {nodes.map((n) => (
                <li key={n.id}>
                  <span className="font-medium text-white">{n.label}</span>
                  <span className="ml-2 text-xs text-slate-500">{n.kind}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-5">
            <h2 className="mb-3 text-sm font-semibold text-white">Edges</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              {edges.map((e) => (
                <li key={`${e.from}-${e.to}`}>
                  {e.from} → {e.to}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
