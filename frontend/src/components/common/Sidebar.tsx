"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  BarChart3,
  Brain,
  Cloud,
  GitBranch,
  GitPullRequest,
  LayoutDashboard,
  Network,
  Play,
  Plug,
  Rocket,
  Settings,
  ShieldCheck,
  Ticket,
  ScanSearch,
  Wrench,
} from "lucide-react";
import { cn } from "@/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "/tenants/betfred", label: "Betfred", icon: Building2 },
  { href: "/tenants/busybees", label: "BusyBees", icon: Building2 },
  { href: "/triage", label: "Triage", icon: ScanSearch },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/runs", label: "Runs", icon: Play },
  { href: "/pull-requests", label: "Pull Requests", icon: GitPullRequest },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/deployments", label: "Deployments", icon: Rocket },
  { href: "/tech-stack", label: "Tech Stack", icon: Cloud },
  { href: "/workflows", label: "Workflows", icon: GitBranch },
  { href: "/skills", label: "Skills", icon: Wrench },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/lineage", label: "Lineage", icon: Network },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/integrations", label: "Integrations", icon: Plug },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-16 flex-col items-center border-r border-slate-800 bg-[#0b0f17] py-4 lg:w-56 lg:items-stretch lg:px-3">
      <Link href="/" className="mb-6 flex items-center gap-3 px-2 lg:px-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(14,165,233,0.35)]">
          N
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-semibold text-white">Newton</p>
          <p className="text-[11px] text-slate-500">The AI Data Engineer</p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sky-500/15 text-sky-300"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
      >
        <Settings className="h-5 w-5 shrink-0" />
        <span className="hidden lg:inline">Settings</span>
      </Link>
    </aside>
  );
}
