import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatDuration, getInitials } from "@/lib/utils";
import { VisitorActions } from "./visitor-actions";
import type { UserRole } from "@/lib/constants";

export interface DetailedVisitor {
  id: string;
  visitorId: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  photoUrl?: string;
  idType?: string;
  idNumber?: string;
  purpose: string;
  customPurpose?: string;
  department?: string;
  expectedDate?: string;
  expectedTime?: string;
  expectedDuration?: number;
  numberOfVisitors?: number;
  vehicleNumber?: string;
  notes?: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt: string;
  updatedAt: string;
  host?: {
    id: string;
    name: string;
    department?: string;
    designation?: string;
    phone?: string;
    email?: string;
    employeeId?: string;
  };
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}

export function VisitorProfile({
  visitor,
  role,
}: {
  visitor: DetailedVisitor;
  role: UserRole;
}) {
  const duration = visitor.checkInTime
    ? formatDuration(visitor.checkInTime, visitor.checkOutTime)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/visitors">
            <ArrowLeft className="size-4" />
            Back to visitors
          </Link>
        </Button>
        <VisitorActions visitor={visitor} role={role} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center gap-4">
              <Avatar className="size-16 rounded-xl">
                {visitor.photoUrl && (
                  <AvatarImage src={visitor.photoUrl} alt={visitor.fullName} />
                )}
                <AvatarFallback className="text-lg">
                  {getInitials(visitor.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{visitor.fullName}</CardTitle>
                <CardDescription>{visitor.visitorId}</CardDescription>
              </div>
              <div className="ml-auto">
                <StatusBadge status={visitor.status} />
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                <InfoRow label="Phone" value={visitor.phone} />
                <InfoRow label="Email" value={visitor.email} />
                <InfoRow label="Company" value={visitor.company} />
                <InfoRow label="Address" value={visitor.address} />
                <InfoRow label="ID Type" value={visitor.idType} />
                <InfoRow label="ID Number" value={visitor.idNumber} />
              </dl>
              {visitor.notes && (
                <>
                  <Separator className="my-4" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Notes: </span>
                    {visitor.notes}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                <InfoRow label="Vehicle Number" value={visitor.vehicleNumber} />
                <InfoRow label="Number of Visitors" value={visitor.numberOfVisitors} />
                <InfoRow label="Created" value={formatDateTime(visitor.createdAt)} />
                <InfoRow label="Updated" value={formatDateTime(visitor.updatedAt)} />
              </dl>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Visit Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              {visitor.host && (
                <div className="py-1.5">
                  <dt className="text-sm text-muted-foreground">Host</dt>
                  <dd className="text-sm font-semibold">{visitor.host.name}</dd>
                  <dd className="text-xs text-muted-foreground">
                    {[visitor.host.designation, visitor.host.department]
                      .filter(Boolean)
                      .join(" · ")}
                  </dd>
                </div>
              )}
              <div className="py-1.5">
                <dt className="text-sm text-muted-foreground">Purpose</dt>
                <dd className="text-sm font-medium">
                  {visitor.customPurpose || visitor.purpose}
                </dd>
              </div>
              <InfoRow label="Department" value={visitor.department} />
              {visitor.expectedDate && (
                <InfoRow label="Expected" value={formatDateTime(visitor.expectedDate)} />
              )}
              {visitor.expectedTime && (
                <InfoRow label="Expected Time" value={visitor.expectedTime} />
              )}
              {visitor.expectedDuration && (
                <InfoRow label="Expected Duration" value={`${visitor.expectedDuration} min`} />
              )}
              <InfoRow label="Check-in" value={visitor.checkInTime ? formatDateTime(visitor.checkInTime) : undefined} />
              <InfoRow label="Check-out" value={visitor.checkOutTime ? formatDateTime(visitor.checkOutTime) : undefined} />
              <InfoRow label="Duration" value={duration} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}