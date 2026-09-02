"use client";

import { usePathname } from "next/navigation";
import { PendingActionsPanel } from "@/components/common/PendingActionsPanel";
import { RecommendationsBanner } from "@/components/common/RecommendationsBanner";
import { Sidebar } from "@/components/common/Sidebar";
import { AuthGuard } from "@/components/common/AuthGuard";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-slate-950">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            <PendingActionsPanel />
            <RecommendationsBanner />
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
