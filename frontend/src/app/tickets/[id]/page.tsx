"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  GitPullRequest,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ExecutionTimeline } from "@/components/tickets/ExecutionTimeline";
import { PhaseChecklist } from "@/components/tickets/PhaseChecklist";
import {
  approveTicket,
  createPullRequest,
  getTicketById,
  rejectTicket,
  runTicketAgain,
} from "@/services/tickets";
import type { TicketDetail } from "@/types";

const tabs = [
  "Overview",
  "Changes",
  "Tests",
  "Deployments",
] as const;

type Tab = (typeof tabs)[number];

export default function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  useEffect(() => {
    getTicketById(params.id)
      .then(setTicket)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500">Loading ticket...</div>
    );
  }

  if (!ticket) {
    notFound();
  }

  const handleAction = async (
    action: () => Promise<void | TicketDetail | null>,
    refresh = false
  ) => {
    const result = await action();
    if (refresh && result) {
      setTicket(result);
    } else if (refresh) {
      const updated = await getTicketById(ticket.id);
      if (updated) setTicket(updated);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/tickets"
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{ticket.id}</h1>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="mt-1 text-slate-400">{ticket.summary}</p>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceScore value={ticket.confidence} />
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-slate-700/50">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && <OverviewTab ticket={ticket} />}
      {activeTab === "Changes" && <ChangesTab ticket={ticket} />}
      {activeTab === "Tests" && <TestsTab ticket={ticket} />}
      {activeTab === "Deployments" && <DeploymentsTab ticket={ticket} />}

      <div className="mt-8 flex items-center gap-3 border-t border-slate-700/50 pt-6">
        <Button
          variant="success"
          onClick={() =>
            handleAction(() => approveTicket(ticket.id), true)
          }
        >
          <Check className="h-4 w-4" />
          Approve
        </Button>
        <Button
          variant="danger"
          onClick={() =>
            handleAction(() => rejectTicket(ticket.id), true)
          }
        >
          <X className="h-4 w-4" />
          Reject
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            handleAction(() => runTicketAgain(ticket.id), true)
          }
        >
          <RefreshCw className="h-4 w-4" />
          Run Again
        </Button>
        <Button
          variant="primary"
          onClick={() =>
            handleAction(() => createPullRequest(ticket.id), true)
          }
        >
          <GitPullRequest className="h-4 w-4" />
          Create PR
        </Button>
      </div>
    </div>
  );
}

function ConfidenceScore({ value }: { value: number }) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-2 text-center">
      <p className="text-2xl font-bold text-white">{value}%</p>
      <p className="text-xs text-slate-500">Confidence</p>
    </div>
  );
}

function OverviewTab({ ticket }: { ticket: TicketDetail }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Execution Timeline
        </h3>
        <ExecutionTimeline steps={ticket.timeline} />
      </div>
      <div className="space-y-6 lg:col-span-2">
        <PhaseChecklist ticketStatus={ticket.status} />
        <Panel title="Root Cause">
          <p className="text-sm leading-relaxed text-slate-300">
            {ticket.rootCause}
          </p>
        </Panel>
        <Panel title="Impact">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ImpactMetric label="Risk Level" value={ticket.impact.level} />
            <ImpactMetric
              label="Files Affected"
              value={String(ticket.impact.filesAffected)}
            />
            <ImpactMetric
              label="Tables Affected"
              value={String(ticket.impact.tablesAffected)}
            />
            <ImpactMetric
              label="Blast Radius"
              value={ticket.impact.blastRadius}
            />
          </div>
        </Panel>
        <Panel title="Summary">
          <p className="text-sm leading-relaxed text-slate-300">
            {ticket.description}
          </p>
        </Panel>
        <Panel title="Impacted Files">
          <div className="space-y-2">
            {ticket.impactedFiles.map((file) => (
              <div
                key={file.path}
                className="flex items-center justify-between rounded-lg bg-slate-900/50 px-3 py-2"
              >
                <code className="text-sm text-blue-400">{file.path}</code>
                <span className="text-xs text-slate-500">
                  +{file.linesAdded} / -{file.linesRemoved}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ChangesTab({ ticket }: { ticket: TicketDetail }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <div className="space-y-1">
        <h3 className="mb-2 text-sm font-semibold text-slate-400">
          Files Changed
        </h3>
        {ticket.impactedFiles.map((file) => (
          <div
            key={file.path}
            className="rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-blue-400"
          >
            {file.path.split("/").pop()}
          </div>
        ))}
      </div>
      <div className="lg:col-span-3">
        {ticket.codeChanges.map((change) => (
          <div
            key={change.file}
            className="overflow-hidden rounded-xl border border-slate-700/50"
          >
            <div className="border-b border-slate-700/50 bg-slate-800/80 px-4 py-2">
              <code className="text-sm text-slate-300">{change.file}</code>
            </div>
            <pre className="overflow-x-auto bg-slate-900/80 p-4 text-xs leading-relaxed">
              {change.diff.split("\n").map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith("+") && !line.startsWith("+++")
                      ? "bg-emerald-500/10 text-emerald-400"
                      : line.startsWith("-") && !line.startsWith("---")
                        ? "bg-red-500/10 text-red-400"
                        : line.startsWith("@@")
                          ? "text-blue-400"
                          : "text-slate-400"
                  }
                >
                  {line}
                </div>
              ))}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestsTab({ ticket }: { ticket: TicketDetail }) {
  const passed = ticket.testResults.filter((t) => t.status === "passed").length;
  const failed = ticket.testResults.filter((t) => t.status === "failed").length;
  const skipped = ticket.testResults.filter((t) => t.status === "skipped").length;

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBox label="Total" value={ticket.testResults.length} />
        <StatBox label="Passed" value={passed} color="text-emerald-400" />
        <StatBox label="Failed" value={failed} color="text-red-400" />
        <StatBox label="Skipped" value={skipped} color="text-slate-400" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700/50">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700/50 bg-slate-800/80">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-400">Test</th>
              <th className="px-4 py-3 font-medium text-slate-400">Type</th>
              <th className="px-4 py-3 font-medium text-slate-400">Environment</th>
              <th className="px-4 py-3 font-medium text-slate-400">Status</th>
              <th className="px-4 py-3 font-medium text-slate-400">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {ticket.testResults.map((test) => (
              <tr key={test.id} className="bg-slate-800/30">
                <td className="px-4 py-3 text-slate-300">{test.name}</td>
                <td className="px-4 py-3 text-slate-400">{test.type}</td>
                <td className="px-4 py-3 text-slate-400">{test.environment}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={test.status} />
                </td>
                <td className="px-4 py-3 text-slate-400">{test.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Data Validation Results
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ticket.dataValidation.map((check) => (
          <div
            key={check.name}
            className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4"
          >
            <p className="text-sm text-slate-400">{check.name}</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {check.value}
            </p>
            <StatusBadge status={check.status} className="mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DeploymentsTab({ ticket }: { ticket: TicketDetail }) {
  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        {ticket.deployments.map((stage, i) => (
          <div key={stage.stage} className="flex items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
                stage.status === "completed"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : stage.status === "in_progress"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-slate-700/50 text-slate-500"
              }`}
            >
              {stage.stage}
            </div>
            {i < ticket.deployments.length - 1 && (
              <div
                className={`h-0.5 w-12 ${
                  stage.status === "completed"
                    ? "bg-emerald-500/50"
                    : "bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700/50">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700/50 bg-slate-800/80">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-400">Stage</th>
              <th className="px-4 py-3 font-medium text-slate-400">Status</th>
              <th className="px-4 py-3 font-medium text-slate-400">Approved By</th>
              <th className="px-4 py-3 font-medium text-slate-400">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {ticket.deployments.map((dep) => (
              <tr key={dep.stage} className="bg-slate-800/30">
                <td className="px-4 py-3 font-medium text-white">
                  {dep.stage}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={dep.status} />
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {dep.approvedBy ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {dep.timestamp
                    ? new Date(dep.timestamp).toLocaleString("en-GB")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

function ImpactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function StatBox({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
