import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listHosts } from "@/lib/services/hosts";
import { VisitorsTable, type HostOption } from "@/components/visitors/visitors-table";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "visitor:read")) redirect("/dashboard");

  const { status } = await searchParams;

  const hostData = await listHosts({ pageSize: 1000 });
  const hosts: HostOption[] = hostData.rows.map((h) => ({
    value: h.id,
    label: h.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visitors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {status === "CHECKED_IN"
              ? "Visitors currently inside the building."
              : "Search, filter and manage all visitor records."}
          </p>
        </div>
        {hasPermission(user, "visitor:create") && (
          <Button asChild>
            <Link href="/visitors/register">
              <UserPlus className="size-4" />
              Register Visitor
            </Link>
          </Button>
        )}
      </div>

      <VisitorsTable initialStatus={status} role={user.role} hosts={hosts} />
    </div>
  );
}