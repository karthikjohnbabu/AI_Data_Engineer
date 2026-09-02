import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getReportSummary } from "@/services/reports";
import { formatCurrency } from "@/utils";
import Link from "next/link";

export default async function ReportsPage() {
  const report = await getReportSummary();

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Agent performance and platform analytics"
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Agent Runs" value={report.agentRuns} />
        <MetricCard label="Success Rate" value={`${report.successRate}%`} />
        <MetricCard
          label="Hours Saved"
          value={`${report.metrics.engineeringHoursSaved}h`}
        />
        <MetricCard
          label="Cost Savings"
          value={formatCurrency(report.metrics.costSavings)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Top Classifications
          </h2>
          {report.topClassifications.length === 0 ? (
            <p className="text-sm text-slate-500">No agent runs yet.</p>
          ) : (
            <div className="space-y-3">
              {report.topClassifications.map((item) => (
                <div
                  key={item.classification}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-slate-300">
                    {item.classification}
                  </span>
                  <span className="text-sm font-medium text-white">
                    {item.count} runs
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Recent Runs</h2>
          {report.recentRuns.length === 0 ? (
            <p className="text-sm text-slate-500">No agent runs yet.</p>
          ) : (
            <div className="space-y-3">
              {report.recentRuns.map((run) => (
                <div
                  key={run.ticketId}
                  className="flex items-center justify-between rounded-lg bg-slate-900/50 px-3 py-2"
                >
                  <div>
                    <Link
                      href={`/tickets/${run.ticketId}`}
                      className="text-sm font-medium text-blue-400 hover:text-blue-300"
                    >
                      {run.ticketId}
                    </Link>
                    <p className="text-xs text-slate-500">{run.classification}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {run.confidence}%
                    </span>
                    <StatusBadge status={run.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
