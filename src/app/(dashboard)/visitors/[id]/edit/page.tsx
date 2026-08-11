import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getVisitorById } from "@/lib/services/visitors";
import { listHosts } from "@/lib/services/hosts";
import { EditVisitorForm, type EditVisitorData } from "@/components/visitors/edit-visitor-form";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function EditVisitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "visitor:update")) redirect("/dashboard");

  const { id } = await params;

  let visitor;
  try {
    visitor = await getVisitorById(id);
  } catch {
    notFound();
  }

  if (visitor.status === "CHECKED_OUT") {
    redirect(`/visitors/${id}`);
  }

  const hostData = await listHosts({ pageSize: 1000 });

  const data: EditVisitorData = {
    id: visitor.id,
    fullName: visitor.fullName,
    phone: visitor.phone,
    email: visitor.email,
    address: visitor.address,
    company: visitor.company,
    photoUrl: visitor.photoUrl,
    idType: visitor.idType,
    idNumber: visitor.idNumber,
    purpose: visitor.purpose,
    customPurpose: visitor.customPurpose,
    hostId: String(visitor.hostId),
    department: visitor.department,
    expectedDate: visitor.expectedDate ? new Date(visitor.expectedDate).toISOString() : undefined,
    expectedTime: visitor.expectedTime,
    expectedDuration: visitor.expectedDuration,
    numberOfVisitors: visitor.numberOfVisitors,
    vehicleNumber: visitor.vehicleNumber,
    notes: visitor.notes,
    status: visitor.status,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Visitor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the details for {visitor.fullName}.
        </p>
      </div>
      <EditVisitorForm
        visitor={data}
        hosts={hostData.rows.map((h) => ({
          value: h.id,
          label: h.name,
          department: h.department,
        }))}
      />
    </div>
  );
}