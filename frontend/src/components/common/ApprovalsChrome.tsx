"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { getApprovals } from "@/services/approvals";

/** Compact approvals teaser — full list lives on /approvals. */
export function ApprovalsChrome() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    getApprovals().then((a) => setCount(a.length));
    const id = setInterval(() => getApprovals().then((a) => setCount(a.length)), 15000);
    return () => clearInterval(id);
  }, [pathname]);

  if (pathname === "/approvals" || count === 0) return null;

  return (
    <Link
      href="/approvals"
      className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 transition hover:border-amber-400/50 hover:bg-amber-500/15"
    >
      <div className="flex items-center gap-2 text-sm text-amber-100">
        <Bell className="h-4 w-4 text-amber-300" />
        <span>
          <span className="font-medium">{count} approval{count === 1 ? "" : "s"}</span>
          {" "}need engineer review before UAT / PROD
        </span>
      </div>
      <span className="text-xs font-medium text-amber-300">Review →</span>
    </Link>
  );
}
