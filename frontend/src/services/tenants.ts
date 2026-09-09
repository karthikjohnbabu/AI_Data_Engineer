import { apiFetch, apiFetchSafe } from "@/services/api";

export interface TenantListItem {
  tenantId: string;
  name: string;
  workflow: string;
  storage: string;
}

export interface TenantListResponse {
  deploymentMode: string;
  configuredTenantId: string | null;
  tenants: TenantListItem[];
}

export interface TenantWorkspace {
  tenantId: string;
  found: boolean;
  name: string;
  storage: { backend: string; mysql_database: string; mysql_table_prefix: string };
  workflow: { default_template: string; templates_dir: string };
  git: { provider: string; repository: string };
  cloud: { provider: string; region: string; environments: string[] };
  skills: { id: string; name: string; source: string; description: string }[];
  rules: {
    id: string;
    name: string;
    requireHumanApproval: boolean;
    guidanceFile: string;
  }[];
  lineage: {
    tenant_id?: string;
    note?: string;
    view?: string;
    layers?: { id: string; label: string; description?: string }[];
    dimensions?: {
      id: string;
      jira?: string;
      label: string;
      gold?: string;
      glue_job?: string;
      iceberg?: {
        id: string;
        label: string;
        raw_from?: string;
        kind?: string;
      }[];
    }[];
    nodes?: { id: string; label: string; kind?: string }[];
    edges?: { from: string; to: string }[];
  };
  productionReports: {
    tenant_id?: string;
    note?: string;
    windows?: { id?: string; label?: string; status?: string }[];
    checks?: { id: string; name: string; status?: string; ticket?: string }[];
    last_run?: string | null;
    powerbi?: {
      id: string;
      name: string;
      workspace?: string;
      dataset?: string;
      type?: string;
      status?: string;
      owner?: string;
      description?: string;
      pages?: string[];
    }[];
  };
  secretsConfigured: Record<string, boolean>;
}

export interface FixItem {
  id: string;
  jira: string;
  dimension: string;
  dimension_key?: string;
  status: string;
  pipeline_stage?: string;
  has_proposed_solution?: boolean;
  has_triage?: boolean;
  path?: string;
  artefacts?: string[];
}

export interface ClientDashboard {
  tenantId: string;
  name: string;
  metrics: {
    ticketsTotal: number;
    ticketsDone: number;
    ticketsInPipeline: number;
    skills: number;
    rules: number;
    lineageNodes: number;
    lineageEdges: number;
    reportChecks: number;
    proposedSolutions: number;
  };
  pipeline: {
    stage: string;
    label: string;
    count: number;
    items: FixItem[];
  }[];
  fixes: FixItem[];
  skills: TenantWorkspace["skills"];
  rules: TenantWorkspace["rules"];
  lineage: TenantWorkspace["lineage"];
  productionReports: TenantWorkspace["productionReports"];
  secretsConfigured: Record<string, boolean>;
}

export interface AdminTenantRow {
  tenantId: string;
  name: string;
  skills: number;
  rules: number;
  skillList: { id?: string; name?: string }[];
  ruleList: { id?: string; name?: string }[];
  health: {
    status: string;
    secretsConfigured: number;
    secretsTotal: number;
    openTickets: number;
    closedTickets: number;
  };
  clientPath: string;
  /** legacy optional fields for fallback mapping */
  workflow?: string;
  fixes?: number;
  fixesDone?: number;
  fixesInProgress?: number;
  lineageNodes?: number;
  secretsConfigured?: Record<string, boolean>;
}

export interface ChatMessage {
  role: "user" | "assistant" | string;
  content: string;
  at?: string;
}

export interface FixChecklistCheck {
  id: string;
  label: string;
  status: string;
  lastRunAt?: string;
  message?: string;
}

export interface FixChecklistPhase {
  id: string;
  label: string;
  workflow_stage?: string;
  status: string;
  lastRunAt?: string;
  runId?: string;
  message?: string;
  checks?: FixChecklistCheck[];
  checksDone?: number;
  checksTotal?: number;
}

export interface FixChecklist {
  found: boolean;
  tenantId?: string;
  fixId: string;
  jira?: string;
  dimension?: string;
  pipelineStage?: string;
  status?: string;
  phases: FixChecklistPhase[];
  currentPhase?: string;
}

export interface StageRunResult {
  tenantId: string;
  status: string;
  template: string;
  stageId: string;
  runId: string;
  outputs: Record<string, unknown>;
}

export interface ArtefactPayload {
  tenantId: string;
  fixId: string;
  artefact: string;
  kind: "html" | "markdown";
  content: string;
}

function withTenant(tenantId: string): HeadersInit {
  return { "X-Tenant-Id": tenantId };
}

export async function listTenants(): Promise<TenantListResponse> {
  return apiFetchSafe("/tenants", {
    deploymentMode: "multi_tenant",
    configuredTenantId: null,
    tenants: [],
  });
}

export async function getTenantWorkspace(
  tenantId?: string
): Promise<TenantWorkspace | null> {
  return apiFetchSafe(
    "/tenants/workspace",
    null,
    tenantId ? { headers: withTenant(tenantId) } : undefined
  );
}

export async function getAdminOverview(): Promise<{ tenants: AdminTenantRow[] }> {
  return apiFetchSafe("/tenants/admin-overview", { tenants: [] });
}

export async function getClientDashboard(
  tenantId: string
): Promise<ClientDashboard | null> {
  return apiFetchSafe("/tenants/client-dashboard", null, {
    headers: withTenant(tenantId),
  });
}

export async function listTenantFixes(tenantId: string): Promise<FixItem[]> {
  const res = await apiFetchSafe<{ fixes: FixItem[] }>(
    "/tenants/fixes",
    { fixes: [] },
    { headers: withTenant(tenantId) }
  );
  return res.fixes;
}

export async function getTenantFix(
  tenantId: string,
  fixId: string
): Promise<FixItem | null> {
  return apiFetchSafe(`/tenants/fixes/${fixId}`, null, {
    headers: withTenant(tenantId),
  });
}

export async function getFixArtefact(
  tenantId: string,
  fixId: string,
  artefact: string
): Promise<ArtefactPayload | null> {
  return apiFetchSafe(
    `/tenants/fixes/${fixId}/artefacts/${encodeURIComponent(artefact)}`,
    null,
    { headers: withTenant(tenantId) }
  );
}

export async function getFixChecklist(
  tenantId: string,
  fixId: string
): Promise<FixChecklist | null> {
  return apiFetchSafe(`/tenants/fixes/${fixId}/checklist`, null, {
    headers: withTenant(tenantId),
  });
}

export async function runFixChecklistPhase(
  tenantId: string,
  fixId: string,
  phaseId: string,
  checkIds?: string[] | null
): Promise<{ checklist: FixChecklist; runId: string; message: string }> {
  return apiFetch(`/tenants/fixes/${fixId}/checklist/run`, {
    method: "POST",
    headers: withTenant(tenantId),
    body: JSON.stringify({
      phaseId,
      checkIds: checkIds && checkIds.length ? checkIds : null,
    }),
  });
}

export async function getTenantChat(
  tenantId: string
): Promise<{ tenantId: string; messages: ChatMessage[] }> {
  return apiFetchSafe(
    "/tenants/chat",
    { tenantId, messages: [] },
    { headers: withTenant(tenantId) }
  );
}

export async function postTenantChat(
  tenantId: string,
  message: string
): Promise<{ tenantId: string; messages: ChatMessage[] }> {
  return apiFetch("/tenants/chat", {
    method: "POST",
    headers: withTenant(tenantId),
    body: JSON.stringify({ message }),
  });
}

export async function runWorkflowStage(
  stageId: string,
  ticketId?: string,
  template?: string
): Promise<StageRunResult> {
  return apiFetch("/tenants/workflows/run-stage", {
    method: "POST",
    body: JSON.stringify({ stageId, ticketId, template }),
  });
}
