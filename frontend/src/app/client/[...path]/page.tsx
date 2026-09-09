import { redirect } from "next/navigation";

/** Legacy /client/* → /tenants/* */
export default async function LegacyClientRedirect({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  redirect(`/tenants/${path.join("/")}`);
}
