"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { TenantSwitcher } from "@/components/common/TenantSwitcher";

const LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/triage": "Triage",
  "/tickets": "Tickets",
  "/runs": "Runs",
  "/pull-requests": "Pull Requests",
  "/approvals": "Approvals",
  "/deployments": "Deployments",
  "/tech-stack": "Tech Stack",
  "/workflows": "Workflows",
  "/skills": "Skills",
  "/memory": "Memory",
  "/reports": "Reports",
  "/lineage": "Lineage",
  "/integrations": "Integrations",
  "/settings": "Settings",
  "/onboarding": "Project Setup",
  "/login": "Login",
};

function currentLabel(pathname: string): string {
  if (LABELS[pathname]) return LABELS[pathname];
  if (pathname.startsWith("/tickets/")) return "Ticket detail";
  const base = "/" + pathname.split("/").filter(Boolean)[0];
  return LABELS[base] ?? "Newton";
}

export function AppTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname === "/";
  const label = currentLabel(pathname);

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
      <div className="flex items-center gap-2">
        {!isDashboard && (
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        <Link
          href="/"
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
            isDashboard
              ? "border border-sky-500/30 bg-sky-500/10 text-sky-300"
              : "border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
      </div>
      <p className="text-xs text-slate-500">
        <span className="text-slate-400">Newton · The AI Data Engineer</span>
        <span className="mx-1.5 text-slate-600">/</span>
        <span className="text-slate-300">{label}</span>
      </p>
      <TenantSwitcher />
    </div>
  );
}
