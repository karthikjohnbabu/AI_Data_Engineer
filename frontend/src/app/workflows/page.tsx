"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { createWorkflow, getWorkflows } from "@/services/platform";
import type { WorkflowDefinition } from "@/types";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phasesText, setPhasesText] = useState(
    `Intake: Jira / Teams / Slack\n- Ticket received\n- Notifications relayed\n\nTriage\n- Classify severity\n- Load sector baseline\n\nInvestigation\n- Root cause\n- Memory search\n\nPlanner\n- Plan fix and tests\n\nCoding\n- Feature branch\n- Generate ETL/ELT changes\n\nTests\n- Unit / integration / DQ\n\nDeploy to DEV\n- DEV validation\n\nPull Request\n- Create PR\n- Human approval\n\nProduction\n- Merge to main\n- Deploy PROD\n- PROD validation\n\nLearn & Close\n- Update Jira\n- Update memory\n- Learn sector skill`
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWorkflows().then(setWorkflows);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createWorkflow(name, description, phasesText);
      setWorkflows(await getWorkflows());
      setShowCreate(false);
      setName("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Workflows"
        description="Newton · The AI Data Engineer — define or customize the full lifecycle in natural language"
        actions={
          <Button onClick={() => setShowCreate(true)}>Define Workflow</Button>
        }
      />

      {showCreate && (
        <div className="mb-8 rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Natural Language Workflow</h2>
          <p className="mb-4 text-sm text-slate-400">
            Describe your phases and tasks in plain English. Lines starting with &quot;Phase&quot; create phases; bullet points become tasks.
          </p>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workflow name"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
            <textarea
              value={phasesText}
              onChange={(e) => setPhasesText(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-white"
            />
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Workflow"}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {workflows.map((wf) => (
          <div key={wf.id} className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{wf.name}</h2>
                {wf.description && <p className="mt-1 text-sm text-slate-400">{wf.description}</p>}
              </div>
              {wf.custom ? (
                <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs text-purple-400">Custom</span>
              ) : (
                <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs text-blue-400">Default</span>
              )}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {wf.phases.map((phase) => (
                <div key={phase.id} className="rounded-lg bg-slate-900/50 p-4">
                  <p className="font-medium text-white">{phase.name}</p>
                  <ul className="mt-2 space-y-1">
                    {phase.tasks.map((task) => (
                      <li key={task} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
