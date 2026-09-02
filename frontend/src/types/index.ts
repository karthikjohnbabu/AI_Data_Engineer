export type TicketStatus = "Done" | "In Progress" | "In Review" | "Failed" | "Open";
export type AgentStatus =
  | "PR Merged"
  | "Investigating"
  | "Awaiting Review"
  | "Generating Fix"
  | "Testing"
  | "Deploying"
  | "Completed"
  | "Failed";
export type Environment = "Prod" | "UAT" | "Dev";
export type TimelineStepStatus = "completed" | "in_progress" | "pending" | "failed";

export interface DashboardMetrics {
  ticketsReceived: number;
  ticketsReceivedChange: number;
  investigated: number;
  investigatedChange: number;
  rootCausesIdentified: number;
  rootCausesChange: number;
  prsCreated: number;
  prsCreatedChange: number;
  testsPassed: number;
  testsPassedChange: number;
  deployed: number;
  deployedChange: number;
  engineeringHoursSaved: number;
  hoursSavedChange: number;
  avgResolutionMinutes: number;
  resolutionTimeChange: number;
  testsExecuted: number;
  testsExecutedChange: number;
  costSavings: number;
  costSavingsChange: number;
}

export interface ActivityDataPoint {
  date: string;
  tickets: number;
  deployed: number;
}

export interface ResolutionBreakdown {
  success: number;
  inProgress: number;
  failed: number;
}

export interface Ticket {
  id: string;
  summary: string;
  status: TicketStatus;
  agentStatus: AgentStatus;
  confidence: number;
  pr: string | null;
  environment: Environment;
  priority: "Critical" | "High" | "Medium" | "Low";
  assignee: string;
  createdAt: string;
}

export interface TimelineStep {
  id: string;
  label: string;
  status: TimelineStepStatus;
  timestamp: string | null;
  description?: string;
}

export interface ImpactedFile {
  path: string;
  changeType: "modified" | "added" | "deleted";
  linesAdded: number;
  linesRemoved: number;
}

export interface CodeChange {
  file: string;
  language: string;
  diff: string;
}

export interface TestResult {
  id: string;
  name: string;
  type: "Unit" | "Integration" | "Data Quality";
  environment: Environment;
  status: "passed" | "failed" | "skipped";
  duration: string;
}

export interface DataValidationResult {
  name: string;
  value: string;
  status: "passed" | "failed";
}

export interface DeploymentStage {
  stage: Environment | "Validation";
  status: "completed" | "in_progress" | "pending" | "failed";
  approvedBy: string | null;
  timestamp: string | null;
}

export interface TicketDetail extends Ticket {
  rootCause: string;
  impact: {
    level: "Low" | "Medium" | "High" | "Critical";
    filesAffected: number;
    tablesAffected: number;
    blastRadius: "Low" | "Medium" | "High";
  };
  summary: string;
  description: string;
  timeline: TimelineStep[];
  impactedFiles: ImpactedFile[];
  codeChanges: CodeChange[];
  testResults: TestResult[];
  dataValidation: DataValidationResult[];
  deployments: DeploymentStage[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "active" | "inactive";
  usageCount: number;
  lastUsed: string;
}

export interface MemoryItem {
  id: string;
  title: string;
  category: "architecture" | "standards" | "incidents" | "fixes" | "deployment";
  content: string;
  tags: string[];
  updatedAt: string;
  source: string;
}

export interface AgentRun {
  ticketId: string;
  status: "queued" | "running" | "completed" | "failed";
  classification: string;
  severity: string;
  rootCause: string;
  confidence: number;
  summary: string;
  completedAt: string | null;
}

export interface Deployment {
  id: string;
  ticketId: string;
  environment: string;
  status: "completed" | "in_progress" | "pending" | "failed";
  approvedBy: string | null;
  timestamp: string | null;
  createdAt: string;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  status: "connected" | "not_configured" | "error";
  description: string;
}

export interface ReportSummary {
  metrics: DashboardMetrics;
  agentRuns: number;
  successRate: number;
  topClassifications: { classification: string; count: number }[];
  recentRuns: {
    ticketId: string;
    classification: string;
    confidence: number;
    status: string;
    completedAt: string | null;
  }[];
}
