import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listActiveHosts } from "@/lib/services/hosts";
import { RegisterVisitorForm } from "@/components/visitors/register-visitor-form";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function RegisterVisitorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "visitor:create")) redirect("/dashboard");

  const hosts = await listActiveHosts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Register Visitor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register a new visitor. They will be checked in immediately or saved as an expected visit.
        </p>
      </div>
      <RegisterVisitorForm
        hosts={hosts.map((h) => ({
          value: h.id,
          label: h.name,
          department: h.department,
        }))}
      />
    </div>
  );
}