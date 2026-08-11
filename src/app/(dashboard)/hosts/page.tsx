import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listHosts, type HostData } from "@/lib/services/hosts";
import { HostsTable } from "@/components/hosts/hosts-table";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HostsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "host:read")) redirect("/dashboard");

  const canManage = hasPermission(user, "host:manage");
  const initial = await listHosts({ pageSize: 20 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hosts / Employees</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage employees who receive visitors. Inactive hosts cannot receive new visitors.
        </p>
      </div>
      <HostsTable
        canManage={canManage}
        initialHosts={(initial.rows as unknown as HostData[]).map((h) => ({
          id: h.id,
          employeeId: h.employeeId,
          name: h.name,
          email: h.email,
          phone: h.phone,
          department: h.department,
          designation: h.designation,
          status: h.status,
        }))}
        initialTotal={initial.total}
      />
    </div>
  );
}