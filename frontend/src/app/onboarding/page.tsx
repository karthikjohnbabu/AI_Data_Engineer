"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common/Button";
import { getDomains, getOnboarding, saveCredentials, saveOnboarding } from "@/services/platform";
import type { DomainBaseline } from "@/types";

const TOTAL_STEPS = 5;

const TOOLS = [
  { id: "aws", name: "AWS", description: "Glue, S3, Redshift, CloudWatch — Dev / UAT / Prod" },
  { id: "jira", name: "Jira", description: "Tickets, transitions, and agent intake" },
  { id: "jenkins", name: "Jenkins", description: "CI/CD pipelines and controlled deploys" },
  { id: "github", name: "GitHub", description: "Repos, feature branches, and merge" },
  { id: "bitbucket", name: "Bitbucket", description: "Repos and pull requests" },
  { id: "slack", name: "Slack", description: "Approvals and notifications" },
  { id: "teams", name: "Microsoft Teams", description: "Approvals and adaptive cards" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];
type AwsEnv = "dev" | "uat" | "prod";

const CREDENTIAL_FIELDS: Record<string, { key: string; label: string; type?: string }[]> = {
  aws: [
    { key: "accessKeyId", label: "Access Key ID" },
    { key: "secretAccessKey", label: "Secret Access Key", type: "password" },
    { key: "region", label: "Region (e.g. eu-west-2)" },
  ],
  jira: [
    { key: "url", label: "Jira URL" },
    { key: "email", label: "Email" },
    { key: "apiToken", label: "API Token", type: "password" },
    { key: "projectKey", label: "Project Key" },
  ],
  jenkins: [
    { key: "url", label: "Jenkins URL" },
    { key: "username", label: "Username" },
    { key: "apiToken", label: "API Token", type: "password" },
  ],
  github: [
    { key: "token", label: "Personal Access Token", type: "password" },
    { key: "repo", label: "Repository (org/repo)" },
  ],
  bitbucket: [
    { key: "workspace", label: "Workspace" },
    { key: "repo", label: "Repository" },
    { key: "appPassword", label: "App Password", type: "password" },
  ],
  slack: [
    { key: "webhookUrl", label: "Webhook URL", type: "password" },
    { key: "botToken", label: "Bot Token", type: "password" },
    { key: "channel", label: "Default Channel" },
  ],
  teams: [
    { key: "webhookUrl", label: "Incoming Webhook URL", type: "password" },
    { key: "powerAutomateUrl", label: "Power Automate Relay URL" },
  ],
};

const AWS_ENV_FIELDS: Record<AwsEnv, { key: string; label: string }> = {
  dev: { key: "devVpc", label: "Dev VPC ID (optional)" },
  uat: { key: "uatVpc", label: "UAT VPC ID (optional)" },
  prod: { key: "prodVpc", label: "Prod VPC ID (optional)" },
};

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-600";

export default function OnboardingPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<DomainBaseline[]>([]);
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState("travel");
  const [projectType, setProjectType] = useState<"new" | "existing">("existing");
  const [clientName, setClientName] = useState("");
  const [context, setContext] = useState("");
  const [query, setQuery] = useState("");
  const [selectedTools, setSelectedTools] = useState<ToolId[]>(["aws", "jira", "jenkins"]);
  const [awsEnvs, setAwsEnvs] = useState<AwsEnv[]>(["dev", "uat", "prod"]);
  const [creds, setCreds] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDomains().then(setDomains);
    getOnboarding().then((c) => {
      if (c.onboarded) {
        router.replace("/");
        return;
      }
      if (c.domain) setDomain(c.domain);
      if (c.projectType) setProjectType(c.projectType);
      if (c.clientName) setClientName(c.clientName);
      if (c.context) setContext(c.context);
    });
  }, [router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return domains;
    return domains.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.id.includes(q) ||
        d.skills.some((s) => s.toLowerCase().includes(q))
    );
  }, [domains, query]);

  const selectedDomain = domains.find((d) => d.id === domain);
  const toolsNeedingCreds = selectedTools;

  function toggleTool(id: ToolId) {
    setSelectedTools((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function toggleAwsEnv(env: AwsEnv) {
    setAwsEnvs((prev) =>
      prev.includes(env) ? prev.filter((e) => e !== env) : [...prev, env]
    );
  }

  function setCredField(service: string, key: string, value: string) {
    setCreds((prev) => ({
      ...prev,
      [service]: { ...(prev[service] || {}), [key]: value },
    }));
  }

  async function handleComplete() {
    setSaving(true);
    setError("");
    try {
      for (const tool of selectedTools) {
        const data = { ...(creds[tool] || {}) };
        if (tool === "aws") {
          data.environments = awsEnvs.join(",");
        }
        const hasAny = Object.values(data).some((v) => String(v).trim());
        if (hasAny) {
          await saveCredentials(tool, data);
        } else if (tool === "aws") {
          await saveCredentials("aws", {
            environments: awsEnvs.join(","),
            region: "eu-west-2",
          });
        }
      }

      const toolSummary = `tools=${selectedTools.join("|")}; awsEnvs=${awsEnvs.join("|")}`;
      await saveOnboarding({
        domain,
        projectType,
        context: [context, toolSummary].filter(Boolean).join("\n"),
        clientName,
        onboarded: true,
      });
      router.replace("/");
    } catch {
      setError("Could not finish setup. Is the Newton API running on port 8000?");
    } finally {
      setSaving(false);
    }
  }

  function canContinue(): boolean {
    if (step === 1) return Boolean(domain);
    if (step === 3) return selectedTools.length > 0;
    if (step === 4) return !selectedTools.includes("aws") || awsEnvs.length > 0;
    return true;
  }

  function next() {
    if (step === 3 && !selectedTools.includes("aws")) {
      setStep(5);
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function back() {
    if (step === 5 && !selectedTools.includes("aws")) {
      setStep(3);
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
          Newton · The AI Data Engineer
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white">Project setup</h1>
        <p className="mt-1 text-sm text-slate-400">
          Complete onboarding to unlock the dashboard. Select your industry, tools, environments, and credentials.
        </p>
      </div>

      <div className="mb-8 flex gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${s <= step ? "bg-sky-500" : "bg-slate-700"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">1. Select your industry</h2>
              <p className="mt-1 text-sm text-slate-400">
                Newton loads sector rules, memories, and skills for your domain.
              </p>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search industries…"
              className={`${inputClass} sm:w-64`}
            />
          </div>
          <div className="grid max-h-[28rem] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDomain(d.id)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  domain === d.id
                    ? "border-sky-500 bg-sky-500/10"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                <p className="font-medium text-white">{d.name}</p>
                <p className="mt-1 text-xs text-slate-400">{d.description}</p>
              </button>
            ))}
          </div>
          <Button onClick={next} disabled={!canContinue()}>
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-white">2. Project details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setProjectType("existing")}
              className={`rounded-xl border p-5 text-left ${
                projectType === "existing" ? "border-sky-500 bg-sky-500/10" : "border-slate-700 bg-slate-800/50"
              }`}
            >
              <p className="font-medium text-white">Existing project</p>
              <p className="mt-2 text-sm text-slate-400">Connect to your current stack and workflows.</p>
            </button>
            <button
              type="button"
              onClick={() => setProjectType("new")}
              className={`rounded-xl border p-5 text-left ${
                projectType === "new" ? "border-sky-500 bg-sky-500/10" : "border-slate-700 bg-slate-800/50"
              }`}
            >
              <p className="font-medium text-white">New project</p>
              <p className="mt-2 text-sm text-slate-400">Provision cloud foundations and lakehouse layout.</p>
            </button>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Client / project name</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. airline group, bank, retailer"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Context</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
              placeholder="Current situation, SLAs, freezes, or architecture requirements"
              className={inputClass}
            />
          </div>
          {selectedDomain && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
              <p className="text-sm font-medium text-sky-400">{selectedDomain.name} baseline selected</p>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={back}>
              Back
            </Button>
            <Button onClick={next}>Continue</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">3. Select your tools</h2>
            <p className="mt-1 text-sm text-slate-400">
              Choose what Newton should connect to. You can add credentials next.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TOOLS.map((tool) => {
              const on = selectedTools.includes(tool.id);
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => toggleTool(tool.id)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    on ? "border-sky-500 bg-sky-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{tool.name}</p>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded border text-[10px] ${
                        on ? "border-sky-400 bg-sky-500 text-slate-950" : "border-slate-600 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{tool.description}</p>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={back}>
              Back
            </Button>
            <Button onClick={next} disabled={!canContinue()}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 4 && selectedTools.includes("aws") && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">4. AWS environments</h2>
            <p className="mt-1 text-sm text-slate-400">
              Select which environments Newton may use for deploy and validation.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["dev", "uat", "prod"] as AwsEnv[]).map((env) => {
              const on = awsEnvs.includes(env);
              return (
                <button
                  key={env}
                  type="button"
                  onClick={() => toggleAwsEnv(env)}
                  className={`rounded-xl border p-5 text-left ${
                    on ? "border-sky-500 bg-sky-500/10" : "border-slate-700 bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium uppercase text-white">{env}</p>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded border text-[10px] ${
                        on ? "border-sky-400 bg-sky-500 text-slate-950" : "border-slate-600 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {env === "dev" && "Auto-deploy after tests"}
                    {env === "uat" && "Human approval gate"}
                    {env === "prod" && "Controlled production release"}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={back}>
              Back
            </Button>
            <Button onClick={next} disabled={!canContinue()}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">5. Credentials</h2>
            <p className="mt-1 text-sm text-slate-400">
              Stored in the Newton backend. You can skip empty fields and fill them later in Settings.
            </p>
          </div>

          <div className="space-y-6">
            {toolsNeedingCreds.map((tool) => (
              <div key={tool} className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-sky-300">
                  {tool}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(CREDENTIAL_FIELDS[tool] || []).map((field) => (
                    <div key={field.key} className={field.type === "password" ? "sm:col-span-2" : ""}>
                      <label className="mb-1 block text-xs text-slate-400">{field.label}</label>
                      <input
                        type={field.type || "text"}
                        value={creds[tool]?.[field.key] || ""}
                        onChange={(e) => setCredField(tool, field.key, e.target.value)}
                        className={inputClass}
                        autoComplete="off"
                      />
                    </div>
                  ))}
                  {tool === "aws" &&
                    awsEnvs.map((env) => (
                      <div key={env}>
                        <label className="mb-1 block text-xs text-slate-400">
                          {AWS_ENV_FIELDS[env].label}
                        </label>
                        <input
                          type="text"
                          value={creds.aws?.[AWS_ENV_FIELDS[env].key] || ""}
                          onChange={(e) => setCredField("aws", AWS_ENV_FIELDS[env].key, e.target.value)}
                          className={inputClass}
                          autoComplete="off"
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={back}>
              Back
            </Button>
            <Button onClick={handleComplete} disabled={saving}>
              {saving ? "Finishing…" : "Complete setup → Dashboard"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
