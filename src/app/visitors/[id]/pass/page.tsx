import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Printer, ArrowLeft, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getVisitorById } from "@/lib/services/visitors";
import { Button } from "@/components/ui/button";
import { formatTime, getInitials } from "@/lib/utils";
import { COMPANY_NAME } from "@/lib/constants";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function VisitorPassPage({
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

  const checkInTime = visitor.checkInTime ? new Date(visitor.checkInTime) : null;
  const validUntil = checkInTime
    ? new Date(checkInTime.getTime() + (visitor.expectedDuration ?? 120) * 60000)
    : null;

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-md space-y-4 print:space-y-0">
        <div className="flex items-center justify-between print:hidden">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/visitors/${visitor.id}`}>
              <ArrowLeft className="size-4" /> Back to visitor
            </Link>
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="size-4" /> Print Pass
          </Button>
        </div>

        <div className="print-area overflow-hidden rounded-2xl border bg-white shadow-lg">
          <div className="border-b-4 border-primary bg-primary px-6 py-4 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-80">
                  Visitor Management
                </p>
                <p className="text-lg font-bold">{COMPANY_NAME}</p>
              </div>
              <ShieldCheck className="size-8 opacity-90" />
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="mb-5 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Visitor Pass
              </p>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {visitor.visitorId}
              </p>
            </div>

            <div className="mx-auto mb-5 grid w-40 place-items-center overflow-hidden rounded-xl border bg-muted">
              {visitor.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={visitor.photoUrl}
                  alt={visitor.fullName}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="grid aspect-square w-full place-items-center bg-muted text-4xl font-semibold text-muted-foreground">
                  {getInitials(visitor.fullName)}
                </div>
              )}
            </div>

            <dl className="divide-y divide-dashed">
              {[
                { label: "Visitor", value: visitor.fullName },
                { label: "Visitor ID", value: visitor.visitorId },
                { label: "Host", value: visitor.host?.name ?? "—" },
                { label: "Purpose", value: visitor.customPurpose || visitor.purpose },
                {
                  label: "Check-in",
                  value: checkInTime ? formatTime(checkInTime) : "—",
                },
                {
                  label: "Valid Until",
                  value: validUntil ? formatTime(validUntil) : "—",
                },
              ].map((row) => (
                <div key={row.label} className="py-3">
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="mt-0.5 text-base font-semibold">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="border-t px-6 py-3 text-center">
            <p className="text-[11px] text-muted-foreground">
              Please present this pass at security when leaving the building.
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              © {new Date().getFullYear()} {COMPANY_NAME}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}