import { apiFetchSafe } from "@/services/api";
import type { Integration } from "@/types";

export async function getIntegrations(): Promise<Integration[]> {
  return apiFetchSafe("/integrations", []);
}
