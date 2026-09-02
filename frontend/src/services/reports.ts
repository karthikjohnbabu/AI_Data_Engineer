import { apiFetchSafe } from "@/services/api";
import type { ReportSummary } from "@/types";

const emptyReport: ReportSummary = {
  metrics: {
    ticketsReceived: 0,
    ticketsReceivedChange: 0,
    investigated: 0,
    investigatedChange: 0,
    rootCausesIdentified: 0,
    rootCausesChange: 0,
    prsCreated: 0,
    prsCreatedChange: 0,
    testsPassed: 0,
    testsPassedChange: 0,
    deployed: 0,
    deployedChange: 0,
    engineeringHoursSaved: 0,
    hoursSavedChange: 0,
    avgResolutionMinutes: 0,
    resolutionTimeChange: 0,
    testsExecuted: 0,
    testsExecutedChange: 0,
    costSavings: 0,
    costSavingsChange: 0,
  },
  agentRuns: 0,
  successRate: 0,
  topClassifications: [],
  recentRuns: [],
};

export async function getReportSummary(): Promise<ReportSummary> {
  return apiFetchSafe("/reports/summary", emptyReport);
}
