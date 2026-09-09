"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  FileArchive,
  Loader2,
  Upload,
  Wrench,
} from "lucide-react";
import {
  downloadTenantSkillsZip,
  listTenantSkillPacks,
  uploadTenantSkillsZip,
  type SkillPackInfo,
} from "@/services/tenants";
import { getClientTheme, type ClientTheme } from "@/lib/clientThemes";

type SkillRow = {
  id?: string;
  name?: string;
  source?: string;
  description?: string;
};

export function SkillsManager({
  tenantId,
  skills,
  onChanged,
  variant = "tenant",
}: {
  tenantId: string;
  skills: SkillRow[];
  onChanged?: () => void;
  variant?: "tenant" | "admin";
}) {
  const theme = getClientTheme(tenantId);
  const admin = variant === "admin";
  const [packs, setPacks] = useState<SkillPackInfo[]>([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const reloadPacks = useCallback(() => {
    listTenantSkillPacks(tenantId)
      .then((r) => setPacks(r.packs || []))
      .catch(() => setPacks([]));
  }, [tenantId]);

  useEffect(() => {
    reloadPacks();
  }, [reloadPacks]);

  async function onDownload(skillId?: string) {
    setBusy(skillId ? `dl-${skillId}` : "dl-all");
    setError("");
    setMessage("");
    try {
      await downloadTenantSkillsZip(tenantId, skillId);
      setMessage(
        skillId
          ? `Downloaded ${skillId}`
          : `Downloaded all tenant skill packs for ${tenantId}`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy("");
    }
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy("upload");
    setError("");
    setMessage("");
    try {
      const res = await uploadTenantSkillsZip(tenantId, file);
      setMessage(res.message);
      reloadPacks();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const colors = admin
    ? {
        card: "border-slate-700/80 bg-slate-900/70",
        text: "text-slate-100",
        muted: "text-slate-400",
        accentBtn: "bg-sky-500 text-slate-950 hover:bg-sky-400",
        ghostBtn:
          "border border-slate-700 text-slate-200 hover:border-sky-500/50 hover:text-white",
        chip: "bg-slate-800 text-slate-300",
      }
    : null;

  return (
    <div className="space-y-4">
      <div
        className={
          admin
            ? "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950/40 p-4"
            : "flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
        }
        style={
          admin
            ? undefined
            : {
                borderColor: theme.railBorder,
                background: `linear-gradient(135deg, ${theme.surface} 0%, ${theme.surfaceAlt} 100%)`,
              }
        }
      >
        <div>
          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${admin ? "text-sky-400" : ""}`}
            style={admin ? undefined : { color: theme.accent }}
          >
            Skill packs
          </p>
          <p
            className={`mt-1 text-sm ${admin ? "text-slate-300" : ""}`}
            style={admin ? undefined : { color: theme.muted }}
          >
            Download tenant packs as zip, or upload a zip with{" "}
            <code className={admin ? "text-sky-300" : ""}>
              skill-id/skill.yaml
            </code>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void onDownload()}
            className={
              admin
                ? `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${colors?.ghostBtn}`
                : "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50"
            }
            style={
              admin
                ? undefined
                : {
                    borderColor: theme.railBorder,
                    color: theme.text,
                    background: theme.surfaceAlt,
                  }
            }
          >
            {busy === "dl-all" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Download all
          </button>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => inputRef.current?.click()}
            className={
              admin
                ? `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${colors?.accentBtn}`
                : "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
            }
            style={
              admin
                ? undefined
                : { background: theme.accent, color: theme.onAccent }
            }
          >
            {busy === "upload" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Upload zip
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(e) => void onUpload(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      {(message || error) && (
        <p
          className={`text-xs ${error ? (admin ? "text-amber-300" : "") : admin ? "text-emerald-300" : ""}`}
          style={
            admin
              ? undefined
              : { color: error ? "#fbbf24" : "#34d399" }
          }
        >
          {error || message}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {skills.length === 0 && (
          <p
            className={`text-sm ${admin ? "text-slate-500" : ""}`}
            style={admin ? undefined : { color: theme.muted }}
          >
            No skills resolved for this tenant yet.
          </p>
        )}
        {skills.map((s) => {
          const pack = packs.find((p) => p.id === s.id);
          const canDl = Boolean(pack);
          return (
            <SkillCard
              key={s.id || s.name}
              skill={s}
              canDownload={canDl}
              busy={busy === `dl-${s.id}`}
              admin={admin}
              theme={theme}
              onDownload={() => void onDownload(s.id)}
            />
          );
        })}
      </div>

      {packs.length > 0 && (
        <div
          className={
            admin
              ? "rounded-xl border border-slate-800 bg-slate-950/50 p-3"
              : "rounded-xl border p-3"
          }
          style={
            admin
              ? undefined
              : { borderColor: theme.railBorder, background: theme.surfaceAlt }
          }
        >
          <p
            className={`mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${admin ? "text-slate-500" : ""}`}
            style={admin ? undefined : { color: theme.muted }}
          >
            <FileArchive className="h-3.5 w-3.5" />
            On-disk tenant packs ({packs.length})
          </p>
          <ul className="space-y-1">
            {packs.map((p) => (
              <li
                key={p.id}
                className={`flex items-center justify-between gap-2 text-xs ${admin ? "text-slate-300" : ""}`}
                style={admin ? undefined : { color: theme.text }}
              >
                <span>
                  {p.id}
                  <span
                    className={`ml-2 ${admin ? "text-slate-500" : ""}`}
                    style={admin ? undefined : { color: theme.muted }}
                  >
                    {p.files.join(", ")}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void onDownload(p.id)}
                  className={
                    admin
                      ? "text-sky-400 hover:text-sky-300"
                      : "font-medium"
                  }
                  style={admin ? undefined : { color: theme.accent }}
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SkillCard({
  skill,
  canDownload,
  busy,
  admin,
  theme,
  onDownload,
}: {
  skill: SkillRow;
  canDownload: boolean;
  busy: boolean;
  admin: boolean;
  theme: ClientTheme;
  onDownload: () => void;
}) {
  return (
    <div
      className={
        admin
          ? "group rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4 transition hover:border-sky-500/40 hover:bg-slate-900"
          : "rounded-2xl border p-4 transition hover:opacity-95"
      }
      style={
        admin
          ? undefined
          : { borderColor: theme.railBorder, background: theme.surface }
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Wrench
              className={`h-4 w-4 shrink-0 ${admin ? "text-sky-400" : ""}`}
              style={admin ? undefined : { color: theme.accent }}
            />
            <h3
              className={`truncate text-sm font-semibold ${admin ? "text-white" : ""}`}
              style={admin ? undefined : { color: theme.text }}
            >
              {skill.name || skill.id}
            </h3>
          </div>
          <p
            className={`mt-1 text-[11px] ${admin ? "text-slate-500" : ""}`}
            style={admin ? undefined : { color: theme.muted }}
          >
            {skill.id}
            {skill.source ? ` · ${skill.source}` : ""}
          </p>
        </div>
        {canDownload && (
          <button
            type="button"
            disabled={busy}
            onClick={onDownload}
            className={
              admin
                ? "inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500/50 disabled:opacity-50"
                : "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] disabled:opacity-50"
            }
            style={
              admin
                ? undefined
                : {
                    borderColor: theme.railBorder,
                    color: theme.text,
                    background: theme.chip,
                  }
            }
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            Zip
          </button>
        )}
      </div>
      <p
        className={`mt-2 text-sm leading-relaxed ${admin ? "text-slate-400" : ""}`}
        style={admin ? undefined : { color: theme.muted }}
      >
        {skill.description || "No description."}
      </p>
    </div>
  );
}
