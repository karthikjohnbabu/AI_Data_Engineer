"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Check, Play, Square } from "lucide-react";
import {
  getFixChecklist,
  listTenantFixes,
  runFixChecklistPhase,
  type FixChecklist,
  type FixItem,
} from "@/services/tenants";
import { getClientTheme } from "@/lib/clientThemes";

export default function FixesChecklistPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const theme = getClientTheme(tenantId);
  const [fixes, setFixes] = useState<FixItem[]>([]);
  const [fixId, setFixId] = useState("");
  const [checklist, setChecklist] = useState<FixChecklist | null>(null);
  const [phaseId, setPhaseId] = useState("phase1");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    listTenantFixes(tenantId).then((list) => {
      setFixes(list);
      if (list[0] && !fixId) setFixId(list[0].id);
    });
  }, [tenantId]);

  useEffect(() => {
    if (!fixId) return;
    getFixChecklist(tenantId, fixId).then((cl) => {
      setChecklist(cl);
      const open =
        cl?.phases.find(
          (p) => p.status !== "success" && p.status !== "done"
        ) || cl?.phases[0];
      if (open) {
        setPhaseId(open.id);
        setSelected(new Set());
      }
    });
  }, [tenantId, fixId]);

  const phase = useMemo(
    () => checklist?.phases.find((p) => p.id === phaseId),
    [checklist, phaseId]
  );
  const checks = phase?.checks || [];

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(checks.map((c) => c.id)));
  }

  function clearSel() {
    setSelected(new Set());
  }

  async function run(mode: "selected" | "phase") {
    if (!fixId || !phase) return;
    if (mode === "selected" && selected.size === 0) {
      setMessage("Select at least one check, or run the whole phase.");
      return;
    }
    setRunning(true);
    setMessage("");
    try {
      const res = await runFixChecklistPhase(
        tenantId,
        fixId,
        phase.id,
        mode === "phase" ? null : [...selected]
      );
      setChecklist(res.checklist);
      setMessage(res.message);
      setSelected(new Set());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  const currentFix = fixes.find((f) => f.id === fixId);

  return (
    <div
      className="flex flex-col gap-3"
      style={{ minHeight: "calc(100vh - 3.5rem)" }}
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: theme.accent }}
          >
            Fixes · Checklist
          </p>
          <h1 className="mt-1 text-2xl font-semibold" style={{ color: theme.text }}>
            Phase checks
          </h1>
          <p className="mt-1 text-sm" style={{ color: theme.muted }}>
            Pick a ticket → phase → select individual checks or run the whole
            phase.
          </p>
        </div>
        <Link
          href={`/tenants/${tenantId}/fixes/results`}
          className="text-xs font-medium"
          style={{ color: theme.accent }}
        >
          Results (HTML) →
        </Link>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[240px_1fr]">
        {/* Ticket list */}
        <aside
          className="max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-xl border p-2"
          style={{ borderColor: theme.railBorder, background: theme.surface }}
        >
          <p
            className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: theme.muted }}
          >
            Tickets
          </p>
          {fixes.map((f) => {
            const on = f.id === fixId;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFixId(f.id)}
                className="mb-1 w-full rounded-lg px-2.5 py-2 text-left"
                style={{
                  background: on ? theme.navActiveBg : "transparent",
                  color: on ? theme.navActiveText : theme.text,
                }}
              >
                <p className="text-[11px] font-semibold" style={{ color: theme.accent }}>
                  {f.jira}
                </p>
                <p className="truncate text-xs">{f.dimension}</p>
              </button>
            );
          })}
        </aside>

        <section className="flex min-h-0 flex-col gap-3">
          {currentFix && (
            <div
              className="rounded-xl border px-4 py-3"
              style={{ borderColor: theme.railBorder, background: theme.surface }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
                    {currentFix.jira}
                  </h2>
                  <p className="text-sm" style={{ color: theme.muted }}>
                    {currentFix.dimension}
                  </p>
                </div>
                <Link
                  href={`/tenants/${tenantId}/fixes/${currentFix.id}`}
                  className="text-xs"
                  style={{ color: theme.accent }}
                >
                  Ticket studio →
                </Link>
              </div>
            </div>
          )}

          {/* Phase tabs */}
          <div className="flex flex-wrap gap-1.5">
            {(checklist?.phases || []).map((p, idx) => {
              const on = p.id === phaseId;
              const ok = p.status === "success" || p.status === "done";
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPhaseId(p.id);
                    setSelected(new Set());
                    setMessage("");
                  }}
                  className="rounded-lg border px-3 py-2 text-left text-xs"
                  style={{
                    borderColor: on ? theme.accent : theme.railBorder,
                    background: on ? theme.navActiveBg : theme.surface,
                    color: on ? theme.navActiveText : theme.text,
                  }}
                >
                  <span className="block font-semibold">
                    Phase {idx + 1}
                    {ok ? " · done" : ""}
                  </span>
                  <span className="block text-[10px]" style={{ color: theme.muted }}>
                    {p.checksDone ?? 0}/{p.checksTotal ?? 0} checks
                  </span>
                </button>
              );
            })}
          </div>

          {phase && (
            <div
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border"
              style={{ borderColor: theme.railBorder, background: theme.surface }}
            >
              <div
                className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5"
                style={{ borderColor: theme.railBorder }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: theme.text }}>
                    {phase.label}
                  </p>
                  <p className="text-[11px]" style={{ color: theme.muted }}>
                    {selected.size
                      ? `${selected.size} check(s) selected`
                      : "Nothing selected — use Run whole phase, or tick checks"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="rounded-md border px-2.5 py-1.5 text-[11px]"
                    style={{ borderColor: theme.railBorder, color: theme.muted }}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={clearSel}
                    className="rounded-md border px-2.5 py-1.5 text-[11px]"
                    style={{ borderColor: theme.railBorder, color: theme.muted }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    disabled={running || selected.size === 0}
                    onClick={() => void run("selected")}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold disabled:opacity-40"
                    style={{ background: theme.chip, color: theme.text }}
                  >
                    <Play className="h-3 w-3" />
                    Run selected
                  </button>
                  <button
                    type="button"
                    disabled={running}
                    onClick={() => void run("phase")}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold disabled:opacity-40"
                    style={{ background: theme.accent, color: theme.onAccent }}
                  >
                    <Play className="h-3 w-3" />
                    Run whole phase
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto p-2">
                {checks.map((c) => {
                  const done = c.status === "success" || c.status === "done";
                  const on = selected.has(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id)}
                      className="flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left"
                      style={{
                        borderColor: on ? theme.accent : theme.railBorder,
                        background: on ? theme.navActiveBg : theme.surfaceAlt,
                      }}
                    >
                      <span className="mt-0.5" style={{ color: on ? theme.accent : theme.muted }}>
                        {on ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block text-sm font-medium"
                          style={{ color: theme.text }}
                        >
                          {c.label}
                        </span>
                        <span
                          className="mt-0.5 block text-[11px]"
                          style={{ color: theme.muted }}
                        >
                          {c.id}
                          {done ? ` · ${c.status}` : " · pending"}
                          {c.lastRunAt ? ` · ${c.lastRunAt}` : ""}
                        </span>
                      </span>
                      {done && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px]"
                          style={{
                            background: "rgba(16,185,129,0.15)",
                            color: "#34d399",
                          }}
                        >
                          done
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {message && (
                <p
                  className="border-t px-3 py-2 text-[11px]"
                  style={{ borderColor: theme.railBorder, color: theme.muted }}
                >
                  {message}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
