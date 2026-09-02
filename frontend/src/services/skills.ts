import { skills } from "@/data/mock/skills";
import type { Skill } from "@/types";

export async function getSkills(): Promise<Skill[]> {
  return Promise.resolve(skills);
}
