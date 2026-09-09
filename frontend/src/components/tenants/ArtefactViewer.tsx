"use client";

import { useEffect, useMemo, useState } from "react";
import { FileCode2, FileText, ScrollText, Wrench } from "lucide-react";
import { getFixArtefact } from "@/services/tenants";
import { getClientTheme } from "@/lib/clientThemes";

type DocBucket = {
  id: string;
  label: string;
  icon: typeof FileText;
  match: (name: string) => boolean;
};

const BUCKETS: DocBucket[] = [
  {
    id: "brief",
    label: "Brief",
    icon: ScrollText,
    match: (n) =>
      /^(readme|notes|triage)/i.test(n) || n.includes("triage_validation"),
  },
  {
    id: "solution",
    label: "Solution",
    icon: FileCode2,
    match: (n) => /proposed_solution|glue_patch|sql_patch|what_fixed/i.test(n),
  },
  {
    id: "evidence",
    label: "Evidence",
    icon: FileText,
    match: (n) =>
      /final_prod|devils_advocate|ai_code_review|pr\.md|place1|sql_vs/i.test(n),
  },
  {
    id: "ops",
    label: "Ops",
    icon: Wrench,
    match: (n) =>
      /watermark|delivery_checklist|dev_redshift|prod_redshift|run_state/i.test(
        n
      ),
  },
];

export function ArtefactViewer({
  tenantId,
  fixId,
  artefacts,
  preferred,
  fillHeight,
}: {
  tenantId: string;
  fixId: string;
  artefacts: string[];
  preferred?: string[];
  fillHeight?: boolean;
}) {
  const theme = getClientTheme(tenantId);

  const ordered = useMemo(() => {
    const pref = preferred || [
      "proposed_solution.html",
      "proposed_solution_2.html",
      "proposed_solution_1.html",
      "triage_validation.html",
      "triage_validation.md",
      "README.md",
      "pr.md",
      "delivery_checklist.md",
      "final_prod_results.md",
    ];
    const rest = artefacts.filter((a) => !pref.includes(a));
    return [...pref.filter((p) => artefacts.includes(p)), ...rest];
  }, [artefacts, preferred]);

  const buckets = useMemo(() => {
    const used = new Set<string>();
    const groups = BUCKETS.map((b) => {
      const files = ordered.filter((n) => b.match(n));
      files.forEach((f) => used.add(f));
      return { ...b, files };
    }).filter((b) => b.files.length > 0);
    const orphan = ordered.filter((n) => !used.has(n));
    if (orphan.length) {
      groups.push({
        id: "other",
        label: "Other",
        icon: FileText,
        match: () => false,
        files: orphan,
      });
    }
    return groups;
  }, [ordered]);

  const [bucketId, setBucketId] = useState(buckets[0]?.id || "brief");
  const activeBucket =
    buckets.find((b) => b.id === bucketId) || buckets[0];
  const files = activeBucket?.files || ordered;

  const [active, setActive] = useState(files[0] || ordered[0] || "");
  const [content, setContent] = useState("");
  const [kind, setKind] = useState<"html" | "markdown">("markdown");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!buckets.length) return;
    if (!buckets.some((b) => b.id === bucketId)) {
      setBucketId(buckets[0].id);
    }
  }, [buckets, bucketId]);

  useEffect(() => {
    if (!files.length) return;
    if (!files.includes(active)) setActive(files[0]);
  }, [files, active]);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    getFixArtefact(tenantId, fixId, active)
      .then((payload) => {
        if (!payload) {
          setContent("Artefact not found.");
          setKind("markdown");
          return;
        }
        setContent(payload.content);
        setKind(payload.kind);
      })
      .finally(() => setLoading(false));
  }, [tenantId, fixId, active]);

  if (!artefacts.length) {
    return (
      <p className="text-sm" style={{ color: theme.muted }}>
        No artefacts in this fix pack.
      </p>
    );
  }

  const viewerH = fillHeight
    ? "h-[calc(100vh-16.5rem)] min-h-[360px]"
    : "h-[calc(100vh-10rem)] min-h-[420px]";

  return (
    <div
      className="flex min-h-0 flex-col overflow-hidden rounded-xl border"
      style={{ borderColor: theme.railBorder, background: theme.surface }}
    >
      {/* Category tabs */}
      <div
        className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5"
        style={{ borderColor: theme.railBorder }}
      >
        {buckets.map((b) => {
          const Icon = b.icon;
          const on = b.id === activeBucket?.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setBucketId(b.id);
                if (b.files[0]) setActive(b.files[0]);
              }}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium"
              style={{
                background: on ? theme.navActiveBg : "transparent",
                color: on ? theme.navActiveText : theme.muted,
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {b.label}
              <span
                className="rounded px-1 text-[10px]"
                style={{ background: theme.chip, color: theme.muted }}
              >
                {b.files.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* File chips for active bucket */}
      <div
        className="flex gap-1 overflow-x-auto border-b px-2 py-1.5"
        style={{ borderColor: theme.railBorder, background: theme.surfaceAlt }}
      >
        {files.map((name) => {
          const on = active === name;
          const isHtml = name.endsWith(".html");
          return (
            <button
              key={name}
              type="button"
              onClick={() => setActive(name)}
              className="shrink-0 rounded-md border px-2 py-1 text-[11px]"
              style={{
                borderColor: on ? theme.accent : "transparent",
                background: on ? theme.navActiveBg : "transparent",
                color: on ? theme.navActiveText : theme.muted,
              }}
              title={name}
            >
              {prettyName(name)}
              {isHtml ? " · html" : ""}
            </button>
          );
        })}
      </div>

      {/* Document stage */}
      <div className={`min-h-0 overflow-hidden ${viewerH}`}>
        {loading ? (
          <p className="p-4 text-sm" style={{ color: theme.muted }}>
            Loading…
          </p>
        ) : kind === "html" ? (
          <iframe
            title={active}
            sandbox=""
            srcDoc={content}
            className="h-full w-full border-0 bg-white"
          />
        ) : (
          <pre
            className="h-full overflow-auto whitespace-pre-wrap p-4 text-xs leading-relaxed"
            style={{ color: theme.text }}
          >
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}

function prettyName(name: string): string {
  return name
    .replace(/\.html$/i, "")
    .replace(/\.md$/i, "")
    .replace(/_/g, " ");
}
