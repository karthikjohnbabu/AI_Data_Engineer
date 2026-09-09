"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CheckSquare,
  Coins,
  FileCode2,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  Network,
  ScrollText,
  Ticket,
  Wrench,
  Shield,
} from "lucide-react";
import { getClientTheme } from "@/lib/clientThemes";
import { cn } from "@/utils";
import { TenantChatDock } from "@/components/tenants/TenantChatDock";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  children?: { href: string; label: string; icon: typeof LayoutDashboard }[];
};

const NAV: NavItem[] = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  {
    href: "/fixes",
    label: "Fixes",
    icon: FileCode2,
    children: [
      { href: "/fixes/checklist", label: "Checklist", icon: CheckSquare },
      { href: "/fixes/results", label: "Results", icon: FlaskConical },
    ],
  },
  { href: "/lineage", label: "Lineage", icon: Network },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/cost-control", label: "Cost Control", icon: Coins },
  { href: "/skills", label: "Skills", icon: Wrench },
  { href: "/rules", label: "Rules", icon: ScrollText },
];

export function ClientShell({
  tenantId,
  tenantName,
  children,
}: {
  tenantId: string;
  tenantName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const theme = getClientTheme(tenantId);
  const base = `/tenants/${tenantId}`;

  function isActive(href: string, exactParent = false): boolean {
    const target = `${base}${href}`;
    if (href === "") return pathname === base;
    if (exactParent && href === "/fixes") {
      // Pack list only — not checklist/results/detail
      return pathname === target;
    }
    return pathname === target || pathname.startsWith(`${target}/`);
  }

  const fixesOpen =
    pathname === `${base}/fixes` ||
    pathname.startsWith(`${base}/fixes/`);

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: theme.heroGradient,
        color: theme.text,
        fontFamily: theme.fontDisplay,
      }}
    >
      <aside
        className="flex w-60 shrink-0 flex-col border-r"
        style={{ background: theme.rail, borderColor: theme.railBorder }}
      >
        <div className="border-b px-4 py-5" style={{ borderColor: theme.railBorder }}>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: theme.accent }}
          >
            {theme.productLabel}
          </p>
          <p className="mt-2 text-sm font-semibold" style={{ color: theme.railText }}>
            {tenantName}
          </p>
          <p className="mt-1 text-[11px]" style={{ color: theme.railMuted }}>
            {theme.vibe}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const target = `${base}${item.href}`;
            const parentActive = item.children
              ? isActive(item.href, true) || fixesOpen
              : isActive(item.href);
            const showKids = Boolean(item.children && fixesOpen);

            return (
              <div key={item.href || "home"}>
                <Link
                  href={target}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition"
                  )}
                  style={{
                    background:
                      (item.children ? isActive(item.href, true) : parentActive)
                        ? theme.navActiveBg
                        : "transparent",
                    color:
                      (item.children ? isActive(item.href, true) : parentActive)
                        ? theme.navActiveText
                        : theme.railMuted,
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
                {showKids && item.children && (
                  <div className="mb-1 ml-3 mt-0.5 space-y-0.5 border-l pl-2" style={{ borderColor: theme.railBorder }}>
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childTarget = `${base}${child.href}`;
                      const childOn =
                        pathname === childTarget ||
                        pathname.startsWith(`${childTarget}/`);
                      return (
                        <Link
                          key={child.href}
                          href={childTarget}
                          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium"
                          style={{
                            background: childOn ? theme.navActiveBg : "transparent",
                            color: childOn ? theme.navActiveText : theme.railMuted,
                          }}
                        >
                          <ChildIcon className="h-3.5 w-3.5" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div
          className="space-y-1 border-t p-3 text-xs"
          style={{ borderColor: theme.railBorder }}
        >
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-md px-2 py-1.5"
            style={{ color: theme.railMuted }}
          >
            <Shield className="h-3.5 w-3.5" />
            Admin
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-2 py-1.5"
            style={{ color: theme.railMuted }}
          >
            <GitBranch className="h-3.5 w-3.5" />
            Newton home
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-2 pb-2 pt-1 lg:px-3 lg:pb-2 lg:pt-1">
          {children}
        </div>
      </main>
      <TenantChatDock tenantId={tenantId} />
    </div>
  );
}
