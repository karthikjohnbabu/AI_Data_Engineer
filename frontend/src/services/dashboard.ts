import {
  activityData,
  dashboardMetrics,
  resolutionBreakdown,
} from "@/data/mock/dashboard";
import type {
  ActivityDataPoint,
  DashboardMetrics,
  ResolutionBreakdown,
} from "@/types";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return Promise.resolve(dashboardMetrics);
}

export async function getActivityData(): Promise<ActivityDataPoint[]> {
  return Promise.resolve(activityData);
}

export async function getResolutionBreakdown(): Promise<ResolutionBreakdown> {
  return Promise.resolve(resolutionBreakdown);
}
