"use client";

import { usePathname } from "next/navigation";
import { AppTopBar } from "@/components/common/AppTopBar";
import { Sidebar } from "@/components/common/Sidebar";
import { AuthGuard } from "@/components/common/AuthGuard";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isOnboarding = pathname === "/onboarding";

  if (isLogin) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  if (isOnboarding) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#070a10]">
          <div className="mx-auto max-w-5xl p-6 lg:p-8">{children}</div>
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
