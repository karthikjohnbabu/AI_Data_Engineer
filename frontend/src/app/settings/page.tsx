"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getCredentials, saveCredentials } from "@/services/platform";
import type { CredentialService } from "@/types";

const CREDENTIAL_FIELDS: Record<string, { key: string; label: string; type?: string }[]> = {
  aws: [
    { key: "accessKeyId", label: "Access Key ID" },
    { key: "secretAccessKey", label: "Secret Access Key", type: "password" },
    { key: "region", label: "Region (e.g. eu-west-2)" },
    { key: "devVpc", label: "Dev VPC ID" },
    { key: "uatVpc", label: "UAT VPC ID" },
    { key: "prodVpc", label: "Prod VPC ID" },
  ],
  jira: [
    { key: "url", label: "Jira URL" },
    { key: "email", label: "Email" },
    { key: "apiToken", label: "API Token", type: "password" },
    { key: "projectKey", label: "Project Key" },
  ],
  bitbucket: [
    { key: "workspace", label: "Workspace" },
    { key: "repo", label: "Repository" },
    { key: "appPassword", label: "App Password", type: "password" },
  ],
  jenkins: [
    { key: "url", label: "Jenkins URL" },
    { key: "username", label: "Username" },
    { key: "apiToken", label: "API Token", type: "password" },
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

export default function SettingsPage() {
  const [credentials, setCredentials] = useState<CredentialService[]>([]);
  const [activeService, setActiveService] = useState("aws");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getCredentials().then(setCredentials);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await saveCredentials(activeService, formData);
      setMessage(`${activeService.toUpperCase()} credentials saved to backend.`);
      const updated = await getCredentials();
      setCredentials(updated);
      setFormData({});
    } catch {
      setMessage("Failed to save. Is the API running?");
    } finally {
      setSaving(false);
    }
  }

  const active = credentials.find((c) => c.service === activeService);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage credentials and platform configuration. All secrets are stored in the backend."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-1">
          {Object.keys(CREDENTIAL_FIELDS).map((svc) => {
            const cred = credentials.find((c) => c.service === svc);
            return (
              <button
                key={svc}
                onClick={() => { setActiveService(svc); setFormData({}); setMessage(""); }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeService === svc
                    ? "bg-blue-600/15 text-blue-400"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                <span className="capitalize">{svc}</span>
                {cred?.configured && (
                  <StatusBadge status="active" className="text-[10px]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <h2 className="mb-4 text-lg font-semibold capitalize text-white">
              {activeService} Credentials
            </h2>
            {active?.configured && (
              <p className="mb-4 text-sm text-emerald-400">Configured — enter new values to update.</p>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              {CREDENTIAL_FIELDS[activeService]?.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-sm text-slate-400">{field.label}</label>
                  <input
                    type={field.type ?? "text"}
                    value={formData[field.key] ?? ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
              {message && <p className="text-sm text-emerald-400">{message}</p>}
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Credentials"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
