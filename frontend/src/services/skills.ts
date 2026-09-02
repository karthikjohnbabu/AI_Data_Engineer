import { skills } from "@/data/mock/skills";
import { apiFetchSafe } from "@/services/api";
import type { Skill } from "@/types";

export async function getSkills(): Promise<Skill[]> {
  return apiFetchSafe("/skills", skills);
}
