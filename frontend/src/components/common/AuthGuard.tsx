"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuthStatus } from "@/services/auth";
import { getOnboarding } from "@/services/platform";
import { getApiKey } from "@/utils/auth";

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
      try {
        const status = await getAuthStatus();
        if (status.authRequired && !getApiKey()) {
          router.replace("/login");
          return;
        }
        if (pathname !== "/onboarding" && pathname !== "/login") {
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
