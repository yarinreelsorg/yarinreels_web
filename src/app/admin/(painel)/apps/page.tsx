import { obterTodosApps } from "@/lib/apps-config";
import AppsAdminClient from "./AppsAdminClient";

export const revalidate = 0;

export default async function AppsAdminPage() {
  const apps = await obterTodosApps();
  return <AppsAdminClient appsIniciais={apps} />;
}
