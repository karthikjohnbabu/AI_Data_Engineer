"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  getFixArtefact,
  listTenantFixes,
  type FixItem,
} from "@/services/tenants";
import { getClientTheme } from "@/lib/clientThemes";

/** Prefer HTML evidence only — no markdown in Results. */
function htmlSortKey(name: string): number {
  const n = name.toLowerCase();
  if (n === "triage_validation.html") return 0;
  if (n.startsWith("proposed_solution")) return 1;
  if (n.includes("final_verdict")) return 2;
  return 9;
}

type ResultHit = {
  fix: FixItem;
  artefact: string;
};

export default function FixesResultsPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const theme = getClientTheme(tenantId);
  const [fixes, setFixes] = useState<FixItem[]>([]);
  const [selected, setSelected] = useState<ResultHit | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listTenantFixes(tenantId).then(setFixes);
  }, [tenantId]);

  const hits = useMemo(() => {
    const out: ResultHit[] = [];
    for (const fix of fixes) {
      const arts = (fix.artefacts || []).filter((a) =>
        a.toLowerCase().endsWith(".html")
      );
      const ordered = [...arts].sort((a, b) => {
        const d = htmlSortKey(a) - htmlSortKey(b);
        return d !== 0 ? d : a.localeCompare(b);
      });
      for (const name of ordered) {
        out.push({ fix, artefact: name });
      }
    }
    return out;
  }, [fixes]);

  useEffect(() => {
    if (!selected && hits[0]) setSelected(hits[0]);
  }, [hits, selected]);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    getFixArtefact(tenantId, selected.fix.id, selected.artefact)
      .then((payload) => {
        setContent(payload?.content || "<p>Not found.</p>");
      })
      .finally(() => setLoading(false));
  }, [tenantId, selected]);

  return (
    <div
      className="grid h-[calc(100vh-0.75rem)] gap-2 lg:grid-cols-[260px_1fr]"
    >
      <aside
        className="overflow-y-auto rounded-xl border p-2"
        style={{ borderColor: theme.railBorder, background: theme.surface }}
      >
        {hits.map((h) => {
          const on =
            selected?.fix.id === h.fix.id &&
            selected?.artefact === h.artefact;
          return (
            <button
              key={`${h.fix.id}-${h.artefact}`}
              type="button"
              onClick={() => setSelected(h)}
              className="mb-1 w-full rounded-lg px-2.5 py-2 text-left"
              style={{
                background: on ? theme.navActiveBg : "transparent",
                color: on ? theme.navActiveText : theme.text,
              }}
            >
              <p
                className="text-[11px] font-semibold"
                style={{ color: theme.accent }}
              >
                {h.fix.jira}
              </p>
              <p className="truncate text-xs">{h.artefact}</p>
            </button>
          );
        })}
        {hits.length === 0 && (
          <p className="p-2 text-sm" style={{ color: theme.muted }}>
            No HTML results yet.
          </p>
        )}
      </aside>

      <section
        className="overflow-hidden rounded-xl border bg-white"
        style={{ borderColor: theme.railBorder }}
      >
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Loading…</p>
        ) : (
          <iframe
            title={selected?.artefact || "result"}
            sandbox=""
            srcDoc={content || "<p>Select a result.</p>"}
            className="h-full min-h-[calc(100vh-0.75rem)] w-full border-0"
          />
        )}
      </section>
    </div>
  );
}
