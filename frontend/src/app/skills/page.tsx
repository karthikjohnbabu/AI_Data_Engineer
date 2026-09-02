import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getSkills } from "@/services/skills";
import { formatDate } from "@/utils";

export default async function SkillsPage() {
  const skills = await getSkills();

  const categories = [...new Set(skills.map((s) => s.category))];

  return (
    <div>
      <PageHeader
        title="Skills"
        description="Agent capabilities for data engineering tasks"
      />

      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            {category}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {skills
              .filter((s) => s.category === category)
              .map((skill) => (
                <div
                  key={skill.id}
                  className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 transition-colors hover:border-slate-600/50"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {skill.name}
                    </h3>
                    <StatusBadge status={skill.status} />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {skill.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Used {skill.usageCount} times</span>
                    <span>Last used {formatDate(skill.lastUsed)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
