"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getClientDashboard, type FixItem } from "@/services/tenants";
import { getClientTheme } from "@/lib/clientThemes";

export default function ClientTicketsPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const theme = getClientTheme(tenantId);
  const [fixes, setFixes] = useState<FixItem[]>([]);

  useEffect(() => {
    getClientDashboard(tenantId).then((d) => setFixes(d?.fixes || []));
  }, [tenantId]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
          Tickets
        </h1>
        <p className="mt-1 text-sm" style={{ color: theme.muted }}>
          Jira work tracked as fix packs for this tenant.
        </p>
      </header>
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: theme.railBorder }}>
        <table className="w-full text-left text-sm">
          <thead style={{ background: theme.surfaceAlt, color: theme.muted }}>
            <tr className="text-[11px] uppercase tracking-wide">
              <th className="px-4 py-3">Jira</th>
              <th className="px-4 py-3">Dimension</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Artefacts</th>
            </tr>
          </thead>
          <tbody style={{ background: theme.surface, color: theme.text }}>
            {fixes.map((f) => (
              <tr key={f.id} className="border-t" style={{ borderColor: theme.railBorder }}>
                <td className="px-4 py-3">
                  <Link href={`/tenants/${tenantId}/fixes/${f.id}`} style={{ color: theme.accent }}>
                    {f.jira}
                  </Link>
                </td>
                <td className="px-4 py-3">{f.dimension}</td>
                <td className="px-4 py-3">{f.status}</td>
                <td className="px-4 py-3">{f.pipeline_stage}</td>
                <td className="px-4 py-3" style={{ color: theme.muted }}>
                  {(f.artefacts || []).length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
