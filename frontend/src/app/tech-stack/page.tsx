"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getTechStack } from "@/services/platform";
import type { TechStack } from "@/types";

export default function TechStackPage() {
  const [stack, setStack] = useState<TechStack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTechStack()
      .then(setStack)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-slate-500">Detecting tech stack...</p>;
  }

  const aws = stack?.services.find((s) => s.name === "AWS");

  return (
    <div>
      <PageHeader
        title="Tech Stack"
        description="Detected services and environments for your organization"
        actions={
          <Link
            href="/settings"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Configure Credentials
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Cloud Provider</p>
          <p className="mt-1 text-xl font-bold text-white capitalize">{stack?.cloud ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Domain</p>
          <p className="mt-1 text-xl font-bold text-white capitalize">{stack?.domain ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Client</p>
          <p className="mt-1 text-xl font-bold text-white">{stack?.client || "Not set"}</p>
        </div>
      </div>

      {aws?.environments && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-white">AWS Environments</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {aws.environments.map((env) => (
              <div
                key={env.name}
                className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-white">{env.name}</p>
                  <StatusBadge status={env.status === "connected" ? "active" : "inactive"} />
                </div>
                <p className="mt-2 text-sm text-slate-400">Region: {env.region}</p>
                {env.vpc && <p className="text-sm text-slate-500">VPC: {env.vpc}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold text-white">Connected Services</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stack?.services.map((svc) => (
          <div
            key={svc.name}
            className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white">{svc.name}</p>
                <p className="text-xs text-slate-500">{svc.category}</p>
              </div>
              <StatusBadge
                status={
                  svc.status === "connected" ? "active"
                    : svc.status === "mock" ? "in_progress"
                      : "inactive"
                }
              />
            </div>
            {svc.note && (
              <p className="mt-2 text-xs text-amber-400/80">{svc.note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
