"use client";

import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/common/AuthGuard";
import { Sidebar } from "@/components/common/Sidebar";

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
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
