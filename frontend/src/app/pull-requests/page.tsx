import { PageHeader } from "@/components/common/PageHeader";
import { PullRequestsTable } from "@/components/pull_requests/PullRequestsTable";

export default function PullRequestsPage() {
  return (
    <div>
      <PageHeader
        title="Pull Requests"
        description="Newton creates PRs after DEV tests and data validation — review before human approval"
      />
      <PullRequestsTable />
    </div>
  );
}
