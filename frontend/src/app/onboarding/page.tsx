"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getDomains, getOnboarding, saveOnboarding } from "@/services/platform";
import type { DomainBaseline } from "@/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<DomainBaseline[]>([]);
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState("betting");
  const [projectType, setProjectType] = useState<"new" | "existing">("existing");
  const [clientName, setClientName] = useState("");
  const [context, setContext] = useState("");
  const [saving, setSaving] = useState(false);
  const [provisionNote, setProvisionNote] = useState("");

  useEffect(() => {
    getDomains().then(setDomains);
    getOnboarding().then((c) => {
      if (c.onboarded) {
        setDomain(c.domain);
        setProjectType(c.projectType);
        setClientName(c.clientName);
        setContext(c.context);
      }
    });
  }, []);

  async function handleComplete() {
    setSaving(true);
    const result = await saveOnboarding({ domain, projectType, context, clientName, onboarded: true });
    if (projectType === "new" && result?.provisionJob?.resources?.note) {
      setProvisionNote(result.provisionJob.resources.note);
    }
    setSaving(false);
    router.push("/tech-stack");
  }

  const selectedDomain = domains.find((d) => d.id === domain);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Project Setup"
        description="Configure your domain baseline and project context"
      />

      <div className="mb-8 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${s <= step ? "bg-blue-500" : "bg-slate-700"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-white">Select your domain</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {domains.map((d) => (
              <button
                key={d.id}
                onClick={() => setDomain(d.id)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  domain === d.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                <p className="font-medium text-white">{d.name}</p>
                <p className="mt-1 text-xs text-slate-400">{d.description}</p>
              </button>
            ))}
          </div>
          <Button onClick={() => setStep(2)}>Continue</Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-white">New or existing project?</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => setProjectType("existing")}
              className={`rounded-xl border p-5 text-left ${
                projectType === "existing" ? "border-blue-500 bg-blue-500/10" : "border-slate-700 bg-slate-800/50"
              }`}
            >
              <p className="font-medium text-white">Existing Project</p>
              <p className="mt-2 text-sm text-slate-400">
                Connect to an existing data platform. Provide current situation and context.
              </p>
            </button>
            <button
              onClick={() => setProjectType("new")}
              className={`rounded-xl border p-5 text-left ${
                projectType === "new" ? "border-blue-500 bg-blue-500/10" : "border-slate-700 bg-slate-800/50"
              }`}
            >
              <p className="font-medium text-white">New Project</p>
              <p className="mt-2 text-sm text-slate-400">
                Automate AWS/Azure network setup, VPCs, data lake architecture, buckets, and metadata layers.
              </p>
            </button>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)}>Continue</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-white">Project details</h2>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Client / Project name</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Betfred, BBees, Busybees"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">
              {projectType === "existing" ? "Current situation / context" : "Architecture requirements"}
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={5}
              placeholder={
                projectType === "existing"
                  ? "e.g. Production migration complete. Incremental loads for source changes. Data freeze active."
                  : "e.g. AWS eu-west-2, medallion architecture, 3 environments (Dev/UAT/Prod)"
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            />
          </div>

          {selectedDomain && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
              <p className="text-sm font-medium text-blue-400">{selectedDomain.name} baseline loaded</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-400">
                {selectedDomain.rules.slice(0, 3).map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={handleComplete} disabled={saving}>
              {saving ? "Saving..." : "Complete Setup"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
