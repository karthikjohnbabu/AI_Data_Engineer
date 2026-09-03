"use client";

import { ApprovalsChrome } from "@/components/common/ApprovalsChrome";
import { RecommendationsBanner } from "@/components/common/RecommendationsBanner";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** When false, skip approvals/recommendation chrome under the title. Default true. */
  showAlerts?: boolean;
}

export function PageHeader({
  title,
  description,
  actions,
  showAlerts = true,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
      </div>
      {showAlerts && (
        <div className="mt-6">
          <ApprovalsChrome />
          <RecommendationsBanner />
        </div>
      )}
    </div>
  );
}
