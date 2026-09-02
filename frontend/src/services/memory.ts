import { memoryItems } from "@/data/mock/memory";
import type { MemoryItem } from "@/types";

export async function getMemoryItems(): Promise<MemoryItem[]> {
  return Promise.resolve(memoryItems);
}
