"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Brain,
  Cloud,
  GitBranch,
  LayoutDashboard,
  Play,
  Plug,
  Rocket,
  Settings,
  Ticket,
  Wrench,
} from "lucide-react";
import { cn } from "@/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/runs", label: "Runs", icon: Play },
  { href: "/deployments", label: "Deployments", icon: Rocket },
  { href: "/tech-stack", label: "Tech Stack", icon: Cloud },
  { href: "/workflows", label: "Workflows", icon: GitBranch },
  { href: "/skills", label: "Skills", icon: Wrench },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/integrations", label: "Integrations", icon: Plug },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-16 flex-col items-center border-r border-slate-700/50 bg-slate-900 py-4 lg:w-56 lg:items-stretch lg:px-3">
      <div className="mb-8 flex items-center gap-3 px-2 lg:px-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
          AI
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-semibold text-white">AI Data Engineer</p>
          <p className="text-xs text-slate-500">Agent Platform</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600/15 text-blue-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
      >
        <Settings className="h-5 w-5 shrink-0" />
        <span className="hidden lg:inline">Settings</span>
      </Link>
    </aside>
  );
}
