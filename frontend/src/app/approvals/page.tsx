import { PageHeader } from "@/components/common/PageHeader";
import { ApprovalsList } from "@/components/approvals/ApprovalsList";
import { PipelineStrip } from "@/components/dashboard/PipelineStrip";

export default function ApprovalsPage() {
  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Engineers approve critical Newton actions before merge and controlled promotion"
        showAlerts={false}
      />
      <div className="mb-6 rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Where human gates sit in the pipeline
        </p>
        <PipelineStrip compact />
      </div>
      <ApprovalsList />
    </div>
  );
}
