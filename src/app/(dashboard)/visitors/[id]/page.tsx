import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getVisitorById } from "@/lib/services/visitors";
import { VisitorProfile, type DetailedVisitor } from "@/components/visitors/visitor-profile";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function VisitorDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "visitor:read")) redirect("/dashboard");

  const { id } = await params;

  let visitor;
  try {
    visitor = await getVisitorById(id);
  } catch {
    notFound();
  }

  return (
    <VisitorProfile visitor={visitor as DetailedVisitor} role={user.role} />
  );
}