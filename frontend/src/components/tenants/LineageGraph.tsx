"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getClientTheme } from "@/lib/clientThemes";

export type LineageIcebergTable = {
  id: string;
  label: string;
  raw_from?: string;
  kind?: string;
};

export type LineageDimension = {
  id: string;
  jira?: string;
  label: string;
  gold?: string;
  glue_job?: string;
  iceberg?: LineageIcebergTable[];
};

export type LineageCatalog = {
  note?: string;
  view?: string;
  layers?: { id: string; label: string; description?: string }[];
  dimensions?: LineageDimension[];
  nodes?: { id: string; label: string; kind?: string }[];
  edges?: { from: string; to: string }[];
};

type Edge = { d: string; strong?: boolean };

export function LineageGraph({
  tenantId,
  lineage,
  nodes,
  edges,
}: {
  tenantId: string;
  lineage?: LineageCatalog | null;
  nodes?: { id: string; label: string; kind?: string }[];
  edges?: { from: string; to: string }[];
}) {
  const theme = getClientTheme(tenantId);
  const dims = lineage?.dimensions || [];
  const [selected, setSelected] = useState<string>(dims[0]?.id || "");

  const current = useMemo(
    () => dims.find((d) => d.id === selected) || dims[0],
    [dims, selected]
  );

  if (dims.length > 0 && current) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="shrink-0">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: theme.muted }}
          >
            Dimensions (Jira)
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dims.map((d) => {
              const active = current.id === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelected(d.id)}
                  className="rounded-md border px-2.5 py-1 text-left text-xs"
                  style={{
                    borderColor: active ? theme.accent : theme.railBorder,
                    background: active ? theme.navActiveBg : theme.surface,
                    color: theme.navActiveText,
                  }}
                >
                  <span className="font-medium">{d.label}</span>
                  {d.jira && (
                    <span className="ml-1.5" style={{ color: theme.muted }}>
                      {d.jira}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <p className="shrink-0 text-xs" style={{ color: theme.muted }}>
          Raw → Iceberg → Gold
        </p>

        <MeasuredLineage
          key={current.id}
          theme={theme}
          goldTitle={current.gold || current.label}
          goldSub={current.glue_job || current.jira || current.id}
          ice={current.iceberg || []}
        />
      </div>
    );
  }

  const flatNodes = nodes || lineage?.nodes || [];
  const flatEdges = edges || lineage?.edges || [];
  if (flatNodes.length === 0) {
    return (
      <p className="text-sm" style={{ color: theme.muted }}>
        No lineage nodes yet for this tenant.
      </p>
    );
  }
  return (
    <div className="text-sm" style={{ color: theme.muted }}>
      {flatNodes.length} nodes · {flatEdges.length} edges (no dimension catalog)
    </div>
  );
}

function MeasuredLineage({
  theme,
  goldTitle,
  goldSub,
  ice,
}: {
  theme: ReturnType<typeof getClientTheme>;
  goldTitle: string;
  goldSub: string;
  ice: LineageIcebergTable[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const goldRef = useRef<HTMLDivElement>(null);
  const rawRefs = useRef<(HTMLDivElement | null)[]>([]);
  const iceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [paths, setPaths] = useState<Edge[]>([]);
  const [box, setBox] = useState({ w: 1, h: 1 });

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const gold = goldRef.current;
    if (!wrap || !gold) return;

    const wr = wrap.getBoundingClientRect();
    const w = Math.max(1, wrap.clientWidth);
    const h = Math.max(1, wrap.clientHeight);
    setBox({ w, h });

    // Client coords relative to padding box (matches SVG at 0,0 of wrap content)
    const ox = wr.left;
    const oy = wr.top;

    const next: Edge[] = [];
    ice.forEach((_, i) => {
      const raw = rawRefs.current[i];
      const mid = iceRefs.current[i];
      if (!raw || !mid) return;
      const a = raw.getBoundingClientRect();
      const b = mid.getBoundingClientRect();
      const c = gold.getBoundingClientRect();

      const rawRight = a.right - ox;
      const rawCy = a.top + a.height / 2 - oy;
      const iceLeft = b.left - ox;
      const iceRight = b.right - ox;
      const iceCy = b.top + b.height / 2 - oy;
      const goldLeft = c.left - ox;
      const goldCy = c.top + c.height / 2 - oy;

      next.push({
        d: curve(rawRight, rawCy, iceLeft, iceCy),
        strong: false,
      });
      next.push({
        d: curve(iceRight, iceCy, goldLeft, goldCy),
        strong: true,
      });
    });
    setPaths(next);
  }, [ice]);

  useEffect(() => {
    measure();
    const id = window.requestAnimationFrame(() => measure());
    const wrap = wrapRef.current;
    const ro = new ResizeObserver(() => measure());
    if (wrap) ro.observe(wrap);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(id);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <div
      ref={wrapRef}
      className="relative min-h-0 w-full flex-1 overflow-auto rounded-xl border"
      style={{
        borderColor: theme.railBorder,
        background: theme.surface,
        maxHeight: "calc(100vh - 12rem)",
      }}
    >
      {/* Pixel-sized SVG — never stretch with inset-0 (that broke arrow ends). */}
      <svg
        className="pointer-events-none absolute left-0 top-0"
        width={box.w}
        height={box.h}
        viewBox={`0 0 ${box.w} ${box.h}`}
        preserveAspectRatio="xMinYMin meet"
      >
        {paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill="none"
            stroke={theme.accent}
            strokeOpacity={p.strong ? 0.85 : 0.45}
            strokeWidth={p.strong ? 2 : 1.5}
            strokeLinecap="round"
          />
        ))}
      </svg>

      <div className="relative grid grid-cols-3 items-center gap-x-12 px-3 py-3">
        <Column title="Raw / source" theme={theme}>
          {ice.map((t, i) => (
            <NodeCard
              key={`raw-${t.id}`}
              ref={(el) => {
                rawRefs.current[i] = el;
              }}
              title={t.raw_from || "Unknown feed"}
              subtitle={`→ ${t.label}`}
              theme={theme}
            />
          ))}
        </Column>
        <Column title="Iceberg curated" theme={theme}>
          {ice.map((t, i) => (
            <NodeCard
              key={`ice-${t.id}`}
              ref={(el) => {
                iceRefs.current[i] = el;
              }}
              title={t.label}
              subtitle={
                t.kind === "gold_enrich" ? "gold enrich" : "curated Iceberg"
              }
              theme={theme}
            />
          ))}
        </Column>
        <Column title="Gold (target)" theme={theme} centre>
          <NodeCard
            ref={goldRef}
            title={goldTitle}
            subtitle={goldSub}
            theme={theme}
            highlight
          />
        </Column>
      </div>
    </div>
  );
}

function curve(x1: number, y1: number, x2: number, y2: number): string {
  const span = x2 - x1;
  const dx = Math.max(24, Math.min(80, Math.abs(span) * 0.4));
  const s = span >= 0 ? 1 : -1;
  return `M ${x1} ${y1} C ${x1 + s * dx} ${y1}, ${x2 - s * dx} ${y2}, ${x2} ${y2}`;
}

function Column({
  title,
  children,
  theme,
  centre,
}: {
  title: string;
  children: React.ReactNode;
  theme: ReturnType<typeof getClientTheme>;
  centre?: boolean;
}) {
  return (
    <div
      className={`z-10 flex min-w-0 flex-col gap-1.5 ${centre ? "self-center" : ""}`}
    >
      <p
        className="text-[9px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: theme.accent }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

const NodeCard = forwardRef<
  HTMLDivElement,
  {
    title: string;
    subtitle: string;
    theme: ReturnType<typeof getClientTheme>;
    highlight?: boolean;
  }
>(function NodeCard({ title, subtitle, theme, highlight }, ref) {
  return (
    <div
      ref={ref}
      className="rounded-md border px-2 py-1"
      style={{
        borderColor: highlight ? theme.accent : theme.railBorder,
        background: theme.surfaceAlt,
        color: theme.text,
      }}
    >
      <p className="truncate text-[11px] font-medium leading-tight" title={title}>
        {title}
      </p>
      <p
        className="mt-0.5 truncate text-[9px] leading-tight"
        style={{ color: theme.muted }}
        title={subtitle}
      >
        {subtitle}
      </p>
    </div>
  );
});
