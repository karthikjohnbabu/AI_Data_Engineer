"use client";

import { useEffect, useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { getClientTheme } from "@/lib/clientThemes";
import { getTenantChat, postTenantChat, type ChatMessage } from "@/services/tenants";

export function TenantChatDock({ tenantId }: { tenantId: string }) {
  const theme = getClientTheme(tenantId);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    getTenantChat(tenantId).then((r) => setMessages(r.messages || []));
  }, [open, tenantId]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput("");
    try {
      const res = await postTenantChat(tenantId, text);
      setMessages((prev) => [...prev, ...(res.messages || [])]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg"
        style={{ background: theme.accent, color: theme.onAccent }}
      >
        <MessageSquare className="h-4 w-4" />
        Newton
      </button>

      {open && (
        <div
          className="fixed bottom-20 right-5 z-40 flex h-[420px] w-[360px] flex-col overflow-hidden rounded-2xl border shadow-2xl"
          style={{
            borderColor: theme.railBorder,
            background: theme.surface,
            color: theme.text,
          }}
        >
          <div
            className="flex items-center justify-between border-b px-3 py-2"
            style={{ borderColor: theme.railBorder }}
          >
            <div>
              <p className="text-sm font-semibold">Newton</p>
              <p className="text-[11px]" style={{ color: theme.muted }}>
                Tenant-scoped · {tenantId}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} style={{ color: theme.muted }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && (
              <p style={{ color: theme.muted }}>
                Ask about lineage, Power BI, or “add rule …” / “add skill …”.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={`${m.at}-${i}`}
                className="rounded-lg px-3 py-2"
                style={{
                  background:
                    m.role === "user" ? theme.navActiveBg : theme.surfaceAlt,
                  color: theme.text,
                }}
              >
                <p className="text-[10px] uppercase" style={{ color: theme.muted }}>
                  {m.role}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t p-2" style={{ borderColor: theme.railBorder }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              placeholder="Ask Newton…"
              className="flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none"
              style={{ borderColor: theme.railBorder, color: theme.text }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void send()}
              className="rounded-lg px-3 py-2 text-sm font-medium"
              style={{ background: theme.accent, color: theme.onAccent }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
