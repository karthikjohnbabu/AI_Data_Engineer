import { apiFetchSafe } from "@/services/api";
import type { Deployment } from "@/types";

export async function getDeployments(): Promise<Deployment[]> {
  return apiFetchSafe("/deployments", []);
}
