import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getIntegrations } from "@/services/integrations";

export default async function IntegrationsPage() {
  const integrations = await getIntegrations();

  const categories = [...new Set(integrations.map((i) => i.category))];

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect external services to the agent platform"
      />

      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            {category}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {integrations
              .filter((i) => i.category === category)
              .map((integration) => (
                <div
                  key={integration.id}
                  className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {integration.name}
                    </h3>
                    <StatusBadge
                      status={
                        integration.status === "connected"
                          ? "active"
                          : "inactive"
                      }
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {integration.description}
                  </p>
                  <p className="mt-4 text-xs text-slate-600">
                    {integration.status === "not_configured"
                      ? "Not configured — add credentials in Settings"
                      : "Connected"}
                  </p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
