"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function PitchBanner() {
  return (
    <section className="relative mb-8 overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(14,165,233,0.18), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 20%, rgba(56,189,248,0.08), transparent 50%)",
        }}
      />
      <div className="relative max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400/90">
          Newton · The AI Data Engineer
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white lg:text-3xl">
          Takes engineering work from Jira to production.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 lg:text-base">
          It investigates the ticket, understands the existing platform, makes the code change,
          tests it in DEV, performs data validation, creates the PR and manages the controlled
          deployment workflow — with engineers approving critical actions.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400"
          >
            Start from a ticket <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/approvals"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            <ShieldCheck className="h-4 w-4 text-amber-300" />
            Review approvals
          </Link>
        </div>
      </div>
    </section>
  );
}
