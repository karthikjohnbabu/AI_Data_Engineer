import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { ResolutionChart } from "@/components/dashboard/ResolutionChart";
import {
  getActivityData,
  getDashboardMetrics,
  getResolutionBreakdown,
} from "@/services/dashboard";
import { formatCurrency } from "@/utils";

export default async function DashboardPage() {
  const [metrics, activity, resolution] = await Promise.all([
    getDashboardMetrics(),
    getActivityData(),
    getResolutionBreakdown(),
  ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="AI agent activity and performance overview"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Tickets Received"
          value={metrics.ticketsReceived}
          change={metrics.ticketsReceivedChange}
          changeLabel="vs last month"
        />
        <MetricCard
          label="Investigated"
          value={metrics.investigated}
          change={metrics.investigatedChange}
          changeLabel="vs last month"
        />
        <MetricCard
          label="Root Causes Found"
          value={metrics.rootCausesIdentified}
          change={metrics.rootCausesChange}
          changeLabel="vs last month"
        />
        <MetricCard
          label="PRs Created"
          value={metrics.prsCreated}
          change={metrics.prsCreatedChange}
          changeLabel="vs last month"
        />
        <MetricCard
          label="Tests Passed"
          value={metrics.testsPassed}
          change={metrics.testsPassedChange}
          changeLabel="vs last month"
        />
        <MetricCard
          label="Deployed"
          value={metrics.deployed}
          change={metrics.deployedChange}
          changeLabel="vs last month"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Activity Over Time
          </h2>
          <ActivityChart data={activity} />
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Resolution Breakdown
          </h2>
          <ResolutionChart data={resolution} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Engineering Hours Saved"
          value={`${metrics.engineeringHoursSaved}h`}
          change={metrics.hoursSavedChange}
          changeLabel="vs last month"
        />
        <MetricCard
          label="Avg. Resolution Time"
          value={`${metrics.avgResolutionMinutes}m`}
          change={metrics.resolutionTimeChange}
          changeLabel="decrease"
        />
        <MetricCard
          label="Tests Executed"
          value={metrics.testsExecuted}
          change={metrics.testsExecutedChange}
          changeLabel="vs last month"
        />
        <MetricCard
          label="Cost Savings"
          value={formatCurrency(metrics.costSavings)}
          change={metrics.costSavingsChange}
          changeLabel="vs last month"
        />
      </div>
    </div>
  );
}
