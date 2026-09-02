import { PageHeader } from "@/components/common/PageHeader";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Platform configuration and integrations"
      />
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-8 text-center">
        <p className="text-slate-400">
          Settings page coming soon — integrations, API keys, and agent
          configuration will be managed here.
        </p>
      </div>
    </div>
  );
}
