"use client";

import { useEffect, useState } from "react";
import { Lightbulb, X } from "lucide-react";
import {
  dismissRecommendation,
  generateRecommendations,
  getRecommendations,
} from "@/services/platform";
import { getRuns } from "@/services/runs";
import type { Recommendation } from "@/types";

export function RecommendationsBanner() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    async function load() {
      const [recs, runs] = await Promise.all([
        getRecommendations(),
        getRuns().catch(() => []),
      ]);

      // Drop stale "first agent" tips once Newton already has runs.
      if (runs.length > 0) {
        const stale = recs.filter(
          (r) => !r.dismissed && (r.category === "onboarding" || r.title === "Run your first agent")
        );
        await Promise.all(stale.map((r) => dismissRecommendation(r.id).catch(() => {})));
      }

      let next = await getRecommendations();
      if (next.filter((r) => !r.dismissed).length === 0) {
        next = await generateRecommendations().catch(() => []);
      }
      setRecommendations(next.filter((r) => !r.dismissed));
    }
    load();
  }, []);

  const top = recommendations.find((r) => !r.dismissed);
  if (!visible || !top) return null;

  async function handleDismiss() {
    await dismissRecommendation(top!.id);
    setRecommendations((prev) => prev.filter((r) => r.id !== top!.id));
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-500/25 bg-sky-500/10 p-4">
      <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
      <div className="flex-1">
        <p className="text-sm font-medium text-sky-100">{top.title}</p>
        <p className="mt-1 text-sm text-sky-100/70">{top.message}</p>
      </div>
      <button onClick={handleDismiss} className="text-sky-300/60 hover:text-sky-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
