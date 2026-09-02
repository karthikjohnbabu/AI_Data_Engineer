"use client";

import { useEffect, useState } from "react";
import { Lightbulb, X } from "lucide-react";
import {
  dismissRecommendation,
  generateRecommendations,
  getRecommendations,
} from "@/services/platform";
import type { Recommendation } from "@/types";

export function RecommendationsBanner() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    getRecommendations().then((recs) => {
      if (recs.length === 0) {
        generateRecommendations().then(setRecommendations).catch(() => {});
      } else {
        setRecommendations(recs);
      }
    });
  }, []);

  const top = recommendations.find((r) => !r.dismissed);
  if (!visible || !top) return null;

  async function handleDismiss() {
    await dismissRecommendation(top!.id);
    setRecommendations((prev) => prev.filter((r) => r.id !== top!.id));
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-200">{top.title}</p>
        <p className="mt-1 text-sm text-amber-200/70">{top.message}</p>
      </div>
      <button onClick={handleDismiss} className="text-amber-400/60 hover:text-amber-200">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
