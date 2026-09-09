"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  getAdminOverview,
  listTenants,
  type AdminTenantRow,
} from "@/services/tenants";
import { ensureApiKeyBootstrapped } from "@/utils/auth";
import { SkillsManager } from "@/components/tenants/SkillsManager";
import {
  ArrowRight,
  Building2,
  HeartPulse,
  ScrollText,
  Shield,
  Sparkles,
  Wrench,
} from "lucide-react";

export default function AdminPage() {
  const [rows, setRows] = useState<AdminTenantRow[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    ensureApiKeyBootstrapped();
    try {
      const overview = await getAdminOverview();
      if (overview.tenants.length > 0) {
        setRows(overview.tenants);
        setSelected((prev) => prev || overview.tenants[0].tenantId);
        return;
      }
      const listed = await listTenants();
      if (listed.tenants.length === 0) {
        setError(
          "No tenants returned from API. Sign in with the API key (Login)."
        );
        setRows([]);
      } else {
        setRows(
          listed.tenants.map((t) => ({
            tenantId: t.tenantId,
            name: t.name,
            skills: 0,
            rules: 0,
            skillList: [],
            ruleList: [],
            health: {
              status: "unknown",
              secretsConfigured: 0,
              secretsTotal: 0,
              openTickets: 0,
              closedTickets: 0,
            },
            clientPath: `/tenants/${t.tenantId}`,
          }))
        );
        setSelected((prev) => prev || listed.tenants[0].tenantId);
        setError("Loaded tenant list only — overview metrics unavailable.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tenants");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const current = rows.find((r) => r.tenantId === selected) || rows[0];

  return (
    <div className="min-h-screen bg-[#060912] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_10%_-10%,rgba(56,189,248,0.18),transparent),radial-gradient(ellipse_50%_35%_at_90%_0%,rgba(168,85,247,0.12),transparent)]" />

      <header className="relative border-b border-slate-800/80 bg-[#0b101c]/85 px-6 py-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400">
              <Sparkles className="h-3 w-3" />
              Newton Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              Tenant health · skills · rules
            </h1>
            <p className="mt-1 max-w-xl text-xs text-slate-500">
              Cross-tenant control plane. Download or upload skill packs per
              tenant. Open a portal for tickets and checklists.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-slate-400 hover:text-white">
              Login
            </Link>
            <Link href="/" className="text-slate-400 hover:text-white">
              Platform home
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-200">
              <Shield className="h-3.5 w-3.5" />
              Admin
            </span>
          </div>
        </div>
      </header>

      <div className="relative grid gap-4 p-4 lg:grid-cols-[270px_1fr] lg:p-6">
        <aside className="rounded-2xl border border-slate-800/90 bg-slate-950/80 p-3 shadow-[0_0_40px_rgba(14,165,233,0.06)]">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Tenants
          </p>
          {loading && <p className="px-2 text-sm text-slate-500">Loading…</p>}
          {!loading && rows.length === 0 && (
            <p className="px-2 text-sm text-amber-300">No tenants yet.</p>
          )}
          <div className="space-y-1">
            {rows.map((row) => {
              const on = selected === row.tenantId;
              return (
                <button
                  key={row.tenantId}
                  type="button"
                  onClick={() => setSelected(row.tenantId)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    on
                      ? "bg-sky-500/15 text-white ring-1 ring-sky-500/40"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <Building2
                    className={`h-4 w-4 shrink-0 ${on ? "text-sky-400" : ""}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{row.name}</span>
                    <span className="block text-[11px] text-slate-500">
                      {row.tenantId} · {row.skills} skills ·{" "}
                      {row.health?.status || "—"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-4">
          {error && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {error}
            </div>
          )}

          {!current ? (
            <p className="text-slate-500">No tenants loaded.</p>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 p-5 shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      {current.name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      /tenants/{current.tenantId}
                    </p>
                  </div>
                  <Link
                    href={current.clientPath}
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.35)] hover:bg-sky-400"
                  >
                    Open tenant portal <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Stat icon={Wrench} label="Skills" value={current.skills} />
                  <Stat icon={ScrollText} label="Rules" value={current.rules} />
                  <Stat
                    icon={HeartPulse}
                    label="Health"
                    value={current.health?.status || "—"}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <h3 className="mb-4 text-sm font-semibold text-white">
                  Skills for {current.name}
                </h3>
                <SkillsManager
                  key={current.tenantId}
                  tenantId={current.tenantId}
                  skills={current.skillList || []}
                  variant="admin"
                  onChanged={() => void load()}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Rules (tenant-local)">
                  {(current.ruleList || []).length === 0 ? (
                    <p className="text-sm text-slate-500">None</p>
                  ) : (
                    <ul className="max-h-64 space-y-1 overflow-y-auto text-sm text-slate-300">
                      {current.ruleList.map((r) => (
                        <li
                          key={r.id || r.name}
                          className="rounded-lg border border-slate-800/80 bg-slate-900/50 px-3 py-2"
                        >
                          <span className="font-medium text-slate-100">
                            {r.name || r.id}
                          </span>
                          {r.id && (
                            <span className="mt-0.5 block text-[11px] text-slate-500">
                              {r.id}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
                <Panel title="General health">
                  <Row
                    label="Secrets configured"
                    value={`${current.health?.secretsConfigured ?? 0} / ${current.health?.secretsTotal ?? 0}`}
                  />
                  <Row
                    label="Open tickets (count only)"
                    value={current.health?.openTickets ?? 0}
                  />
                  <Row
                    label="Closed tickets (count only)"
                    value={current.health?.closedTickets ?? 0}
                  />
                </Panel>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wrench;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4 text-sky-400/80" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  );
}
