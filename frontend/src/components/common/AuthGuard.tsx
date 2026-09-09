"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuthStatus } from "@/services/auth";
import { getOnboarding } from "@/services/platform";
import { ensureApiKeyBootstrapped, getApiKey } from "@/utils/auth";

function isPortalPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/tenants/") ||
    pathname.startsWith("/client/")
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      if (pathname === "/login") {
        setReady(true);
        return;
      }
      ensureApiKeyBootstrapped();
      try {
        const status = await getAuthStatus();
        if (status.authRequired && !getApiKey()) {
          router.replace("/login");
          return;
        }
        if (isPortalPath(pathname)) {
          setReady(true);
          return;
        }
        // Local demo: API key from NEXT_PUBLIC_API_KEY — skip onboarding gate
        // so Admin / tenant menu links stay reachable on home.
        const localDemoKey = Boolean(process.env.NEXT_PUBLIC_API_KEY);
        if (pathname === "/onboarding") {
          if (localDemoKey) {
            router.replace("/");
            return;
          }
          const onboarding = await getOnboarding();
          if (onboarding.onboarded) {
            router.replace("/");
            return;
          }
          setReady(true);
          return;
        }
        if (pathname !== "/login" && !localDemoKey) {
          const onboarding = await getOnboarding();
          if (!onboarding.onboarded) {
            router.replace("/onboarding");
            return;
          }
        }
      } catch {
        // API down — allow access with mock fallback
      }
      setReady(true);
    }
    check();
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
