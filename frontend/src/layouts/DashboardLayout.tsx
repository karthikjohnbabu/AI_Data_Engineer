"use client";

import { usePathname } from "next/navigation";
import { AppTopBar } from "@/components/common/AppTopBar";
import { Sidebar } from "@/components/common/Sidebar";
import { AuthGuard } from "@/components/common/AuthGuard";

function isTenantPortal(pathname: string): boolean {
  return pathname.startsWith("/tenants/");
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isOnboarding = pathname === "/onboarding";
  const isAdmin =
    pathname === "/admin" || pathname.startsWith("/admin/");

  if (isLogin) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  // Tenant portals use their own chrome (ClientShell).
  if (isOnboarding || isTenantPortal(pathname)) {
    return (
      <AuthGuard>
        <div className="min-h-screen">{children}</div>
      </AuthGuard>
    );
  }

  // Admin keeps the main Sidebar so Betfred / BusyBees menu links are visible.
  if (isAdmin) {
    return (
      <AuthGuard>
        <div className="flex h-screen overflow-hidden bg-slate-950">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-slate-950">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            <AppTopBar />
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
