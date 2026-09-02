import { memoryItems } from "@/data/mock/memory";
import { apiFetchSafe } from "@/services/api";
import type { MemoryItem } from "@/types";

export async function getMemoryItems(
  category?: MemoryItem["category"]
): Promise<MemoryItem[]> {
  const endpoint = category ? `/memory?category=${category}` : "/memory";
  return apiFetchSafe(endpoint, memoryItems);
}
