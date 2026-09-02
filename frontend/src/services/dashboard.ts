import {
  activityData,
  dashboardMetrics,
  resolutionBreakdown,
} from "@/data/mock/dashboard";
import { apiFetchSafe } from "@/services/api";
import type {
  ActivityDataPoint,
  DashboardMetrics,
  ResolutionBreakdown,
} from "@/types";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return apiFetchSafe("/dashboard/metrics", dashboardMetrics);
}

export async function getActivityData(): Promise<ActivityDataPoint[]> {
  return apiFetchSafe("/dashboard/activity", activityData);
}

export async function getResolutionBreakdown(): Promise<ResolutionBreakdown> {
  return apiFetchSafe("/dashboard/resolution", resolutionBreakdown);
}
