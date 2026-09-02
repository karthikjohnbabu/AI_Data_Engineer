"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { getMemoryItems } from "@/services/memory";
import type { MemoryItem } from "@/types";
import { formatDate } from "@/utils";

const categoryLabels: Record<MemoryItem["category"], string> = {
  architecture: "Architecture Decisions",
  standards: "Engineering Standards",
  incidents: "Previous Incidents",
  fixes: "Known Fixes",
  deployment: "Deployment Rules",
};

const categories = Object.keys(categoryLabels) as MemoryItem["category"][];

export default function MemoryPage() {
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<
    MemoryItem["category"] | "all"
  >("all");

  useEffect(() => {
    getMemoryItems()
      .then(setMemoryItems)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return memoryItems;
    return memoryItems.filter((item) => item.category === activeCategory);
  }, [memoryItems, activeCategory]);

  return (
    <div>
      <PageHeader
        title="Memory"
        description="Organizational knowledge used by the AI agent"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <CategoryPill
          label="All"
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
        />
        {categories.map((cat) => (
          <CategoryPill
            key={cat}
            label={categoryLabels[cat]}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </div>

      <div className="space-y-4">
        {loading && (
          <p className="text-center text-slate-500">Loading memory...</p>
        )}
        {!loading && filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-blue-400">
                  {categoryLabels[item.category]}
                </span>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {item.title}
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {formatDate(item.updatedAt)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {item.content}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-700/50 px-2.5 py-0.5 text-xs text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-xs text-slate-600">{item.source}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
