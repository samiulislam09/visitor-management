"use client";

import * as React from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime, toTitleCase } from "@/lib/utils";

export interface AuditLogRow {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

function actionStyles(action: string): string {
  if (action.includes("CHECKED_OUT")) return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
  if (action.includes("CHECKED_IN")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (action.includes("DELETED") || action.includes("CANCELLED")) return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  if (action.includes("CREATED")) return "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300";
  return "bg-muted text-muted-foreground";
}

export function AuditLogsView() {
  const [rows, setRows] = React.useState<AuditLogRow[] | null>(null);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  const pageSize = 20;

  const fetchData = React.useCallback(async (nextPage: number) => {
    try {
      const res = await fetch(
        `/api/audit-logs?page=${nextPage}&pageSize=${pageSize}`,
        { cache: "no-store" }
      );
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? "Failed");
      setRows(body.data.rows);
      setTotal(body.data.total);
      setPage(body.data.page);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const load = (async () => {
      await fetchData(1);
    })();
    void load;
  }, [fetchData]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          A record of every important action taken in the system.
        </p>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); void fetchData(page); }}>
          <RefreshCw className="size-4" /> Refresh
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !rows || rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    title="No audit logs yet"
                    description="Actions such as visitor registration and check-outs will appear here."
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const metadata = row.metadata
                  ? Object.entries(row.metadata)
                      .filter(([k]) => !["password", "passwordHash"].includes(k))
                      .map(([k, v]) => `${k}: ${formatMetadata(v)}`)
                      .join(", ")
                  : "";
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Badge variant="outline" className={actionStyles(row.action)}>
                        {toTitleCase(row.action.replace("_", " "))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.entityType}
                      {row.entityId ? ` · ${row.entityId.slice(0, 10)}…` : ""}
                    </TableCell>
                    <TableCell>{row.userName ?? "System"}</TableCell>
                    <TableCell className="max-w-64 truncate text-xs text-muted-foreground">
                      {metadata || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(row.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} entries)
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => { setLoading(true); void fetchData(page - 1); }}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => { setLoading(true); void fetchData(page + 1); }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatMetadata(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return formatDateTime(value);
  }
  return String(value);
}