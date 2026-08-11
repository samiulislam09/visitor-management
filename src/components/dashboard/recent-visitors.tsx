import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatTime, getInitials } from "@/lib/utils";
import type { VisitorListRow } from "@/lib/services/visitors";

export function RecentVisitors({ rows }: { rows: VisitorListRow[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Visitors</CardTitle>
          <CardDescription>Latest registered visitors</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/visitors">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        {rows.length === 0 ? (
          <EmptyState
            title="No visitors yet"
            description="Register your first visitor to get started."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        {row.photoUrl && (
                          <AvatarImage src={row.photoUrl} alt={row.fullName} />
                        )}
                        <AvatarFallback>{getInitials(row.fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link
                          href={`/visitors/${row.id}`}
                          className="font-medium hover:underline"
                        >
                          {row.fullName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{row.visitorId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.phone}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.host?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.customPurpose || row.purpose}
                  </TableCell>
                  <TableCell>{row.checkInTime ? formatTime(row.checkInTime) : "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}