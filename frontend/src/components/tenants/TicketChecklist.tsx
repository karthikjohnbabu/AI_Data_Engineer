"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Circle, Loader2, Play } from "lucide-react";
import { getClientTheme } from "@/lib/clientThemes";
import {
  getFixChecklist,
  runFixChecklistPhase,
  type FixChecklist,
  type FixChecklistPhase,
} from "@/services/tenants";

/** Compact runway for ticket studio — full editor lives under Fixes → Checklist. */
export function TicketChecklist({
  tenantId,
  fixId,
  onUpdated,
}: {
  tenantId: string;
  fixId: string;
  onUpdated?: () => void;
  compact?: boolean;
}) {
  const theme = getClientTheme(tenantId);
  const [data, setData] = useState<FixChecklist | null>(null);
  const [running, setRunning] = useState(false);
  const [focused, setFocused] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    getFixChecklist(tenantId, fixId).then((cl) => {
      setData(cl);
      if (cl) {
        const next =
          cl.phases.find(
            (p) => p.status !== "success" && p.status !== "done"
          ) || cl.phases[0];
        setFocused((prev) => prev || next?.id || "");
      }
    });
  }, [tenantId, fixId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const active: FixChecklistPhase | undefined = useMemo(() => {
    if (!data) return undefined;
    return data.phases.find((p) => p.id === focused) || data.phases[0];
  }, [data, focused]);

  async function runPhase() {
    if (!active) return;
    setRunning(true);
    setError("");
    try {
      const res = await runFixChecklistPhase(tenantId, fixId, active.id, null);
      setData(res.checklist);
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  if (!data) {
    return (
      <p className="text-sm" style={{ color: theme.muted }}>
        Loading runway…
      </p>
    );
  }

  const doneCount = data.phases.filter(
    (p) => p.status === "success" || p.status === "done"
  ).length;
  const total = data.phases.length || 1;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div
      className="rounded-xl border"
      style={{ borderColor: theme.railBorder, background: theme.surface }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"
        style={{ borderColor: theme.railBorder }}
      >
        <div className="flex items-center gap-3">
          <p
            className="text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: theme.accent }}
          >
            Delivery runway
          </p>
          <div
            className="h-1.5 w-28 overflow-hidden rounded-full"
            style={{ background: theme.chip }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: theme.accent }}
            />
          </div>
          <span className="text-[11px]" style={{ color: theme.muted }}>
            {doneCount}/{total} phases
          </span>
        </div>
        <Link
          href={`/tenants/${tenantId}/fixes/checklist`}
          className="text-[11px] font-medium"
          style={{ color: theme.accent }}
        >
          Open checklist (select checks) →
        </Link>
      </div>

      <div className="flex gap-1 overflow-x-auto px-2 py-2">
        {data.phases.map((p, idx) => {
          const done = p.status === "success" || p.status === "done";
          const on = focused === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setFocused(p.id)}
              className="flex min-w-[8rem] flex-1 flex-col rounded-lg border px-2.5 py-2 text-left"
              style={{
                borderColor: on ? theme.accent : theme.railBorder,
                background: on ? theme.navActiveBg : theme.surfaceAlt,
              }}
            >
              <span
                className="flex items-center gap-1 text-[10px]"
                style={{ color: theme.muted }}
              >
                {done ? (
                  <Check className="h-3 w-3" style={{ color: "#34d399" }} />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
                Phase {idx + 1}
              </span>
              <span
                className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug"
                style={{ color: on ? theme.navActiveText : theme.text }}
              >
                {p.label}
              </span>
              <span className="mt-1 text-[10px]" style={{ color: theme.muted }}>
                {p.checksDone ?? 0}/{p.checksTotal ?? 0} checks
              </span>
            </button>
          );
        })}
      </div>

      {active && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2.5"
          style={{ borderColor: theme.railBorder, background: theme.surfaceAlt }}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: theme.text }}>
              {active.label}
            </p>
            <p className="truncate text-[11px]" style={{ color: theme.muted }}>
              {active.message ||
                "Run whole phase here, or open Checklist to tick individual checks."}
            </p>
            {error && <p className="text-[11px] text-amber-400">{error}</p>}
          </div>
          <button
            type="button"
            disabled={running}
            onClick={() => void runPhase()}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold disabled:opacity-50"
            style={{ background: theme.accent, color: theme.onAccent }}
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {running ? "Running…" : "Run whole phase"}
          </button>
        </div>
      )}
    </div>
  );
}
