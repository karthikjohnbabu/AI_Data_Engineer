"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getAdminOverview,
  listTenants,
  type AdminTenantRow,
} from "@/services/tenants";
import { ensureApiKeyBootstrapped } from "@/utils/auth";
import {
  ArrowRight,
  Building2,
  HeartPulse,
  ScrollText,
  Shield,
  Wrench,
} from "lucide-react";

export default function AdminPage() {
  const [rows, setRows] = useState<AdminTenantRow[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      ensureApiKeyBootstrapped();
      try {
        const overview = await getAdminOverview();
        if (cancelled) return;
        if (overview.tenants.length > 0) {
          setRows(overview.tenants);
          setSelected(overview.tenants[0].tenantId);
          setLoading(false);
          return;
        }
        const listed = await listTenants();
        if (cancelled) return;
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
          setSelected(listed.tenants[0].tenantId);
          setError("Loaded tenant list only — overview metrics unavailable.");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load tenants");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const current = rows.find((r) => r.tenantId === selected) || rows[0];

  return (
    <div className="min-h-screen bg-[#070a10] text-slate-100">
      <header className="border-b border-slate-800/80 bg-[#0b0f17]/90 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400">
              Newton Admin
            </p>
            <h1 className="mt-1 text-xl font-semibold text-white">
              Tenant health · skills · rules
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              No ticket workflows or tenant-internal runbooks here — open the
              tenant portal for that.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-slate-400 hover:text-white">
              Login
            </Link>
            <Link href="/" className="text-slate-400 hover:text-white">
              Platform home
            </Link>
            <Shield className="h-4 w-4 text-amber-300" />
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[260px_1fr] lg:p-5">
        <aside className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Tenants
          </p>
          {loading && <p className="px-2 text-sm text-slate-500">Loading…</p>}
          {!loading && rows.length === 0 && (
            <p className="px-2 text-sm text-amber-300">No tenants yet.</p>
          )}
          <div className="space-y-1">
            {rows.map((row) => (
              <button
                key={row.tenantId}
                type="button"
                onClick={() => setSelected(row.tenantId)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm ${
                  selected === row.tenantId
                    ? "bg-white/5 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <span>
                  <span className="block font-medium">{row.name}</span>
                  <span className="block text-[11px] text-slate-500">
                    {row.tenantId} · {row.health?.status || "—"}
                  </span>
                </span>
              </button>
            ))}
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
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5">
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
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
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

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Skills">
                  {(current.skillList || []).length === 0 ? (
                    <p className="text-sm text-slate-500">None</p>
                  ) : (
                    <ul className="space-y-1 text-sm text-slate-300">
                      {current.skillList.map((s) => (
                        <li key={s.id || s.name}>
                          {s.name || s.id}
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
                <Panel title="Rules">
                  {(current.ruleList || []).length === 0 ? (
                    <p className="text-sm text-slate-500">None</p>
                  ) : (
                    <ul className="space-y-1 text-sm text-slate-300">
                      {current.ruleList.map((r) => (
                        <li key={r.id || r.name}>
                          {r.name || r.id}
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>

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
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
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
