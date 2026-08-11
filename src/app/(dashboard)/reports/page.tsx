import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listHosts } from "@/lib/services/hosts";
import { listDepartments } from "@/lib/services/visitors";
import { ReportsClient } from "@/components/reports/reports-client";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "report:read")) redirect("/dashboard");

  const [hostsData, departments] = await Promise.all([
    listHosts({ pageSize: 1000 }),
    listDepartments(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyse visitor activity, filter by date range and export to CSV.
        </p>
      </div>
      <ReportsClient
        hosts={hostsData.rows.map((h) => ({ value: h.id, label: h.name }))}
        departments={departments}
      />
    </div>
  );
}