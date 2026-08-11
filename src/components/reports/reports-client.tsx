"use client";

import * as React from "react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { toast } from "sonner";
import { Download, Search, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNumber,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { FilterSelect } from "@/components/filter-select";
import { NativeSelect } from "@/components/ui/native-select";
import { formatDateTime, formatDuration, formatTime, cn } from "@/lib/utils";
import { VISITOR_STATUSES, VISIT_PURPOSES } from "@/lib/constants";
import type { VisitorListRow } from "@/lib/services/visitors";

export interface HostOption {
  value: string;
  label: string;
}

interface ReportData {
  rows: VisitorListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    totalVisits: number;
    totalCheckins: number;
    totalCheckouts: number;
    currentlyInside: number;
    avgDurationMs: number | null;
  };
}

function buildQuery(filters: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  (Object.entries(filters) as [string, string | undefined][]).forEach(([key, value]) => {
    if (value && value !== "all" && value !== "") params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function ReportsClient({
  hosts,
  departments,
}: {
  hosts: HostOption[];
  departments: string[];
}) {
  const [data, setData] = React.useState<ReportData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [filters, setFilters] = React.useState<Record<string, string | undefined>>({
    search: "",
    status: undefined,
    purpose: undefined,
    hostId: undefined,
    department: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    sort: "createdAt_desc",
    page: "1",
  });

  const fetchData = React.useCallback(async (next: Record<string, string | undefined>) => {
    try {
      const res = await fetch(`/api/reports${buildQuery(next)}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? "Failed to load report");
      setData(body.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const load = (async () => {
      await fetchData(filters);
    })();
    void load;
  }, [filters, fetchData]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setLoading(true);
    setFilters((prev) => ({ ...prev, search: value, page: "1" }));
  }, 400);

  function setFilter(key: string, value: string) {
    setLoading(true);
    setFilters((prev) => ({ ...prev, [key]: value === "all" ? undefined : value, page: "1" }));
  }

  function setPage(page: number) {
    setLoading(true);
    setFilters((prev) => ({ ...prev, page: String(page) }));
  }

  function clearFilters() {
    setLoading(true);
    setFilters({
      search: "",
      status: undefined,
      purpose: undefined,
      hostId: undefined,
      department: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sort: "createdAt_desc",
      page: "1",
    });
  }

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) =>
      key !== "sort" && key !== "page" && key !== "search" && value !== undefined && value !== ""
  );

  const exportUrl = `/api/reports/export${buildQuery({ ...filters, page: undefined, pageSize: undefined })}`;

  const page = data?.page ?? 1;
  const pageSize = data?.pageSize ?? 20;
  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pageItems: number[] = [];
  if (data) {
    const start = Math.max(1, page - 2);
    const end = Math.min(data.totalPages, page + 2);
    for (let i = start; i <= end; i++) pageItems.push(i);
  }

  const summary = data?.summary;
  const avgDuration = summary?.avgDurationMs != null ? formatDurationMs(summary.avgDurationMs) : "—";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <SummaryCard label="Total Visits" value={String(summary?.totalVisits ?? "—")} />
        <SummaryCard label="Total Check-ins" value={String(summary?.totalCheckins ?? "—")} />
        <SummaryCard label="Total Check-outs" value={String(summary?.totalCheckouts ?? "—")} />
        <SummaryCard label="Currently Inside" value={String(summary?.currentlyInside ?? "—")} />
        <SummaryCard label="Avg Visit Duration" value={avgDuration} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search visitor, phone or company…"
              className="pl-9"
              defaultValue={filters.search}
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) => setFilter("dateFrom", e.target.value)}
              className="h-9 w-40"
              aria-label="From date"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) => setFilter("dateTo", e.target.value)}
              className="h-9 w-40"
              aria-label="To date"
            />
            <FilterSelect
              placeholder="Status"
              value={filters.status}
              onValueChange={(v) => setFilter("status", v)}
              options={VISITOR_STATUSES.map((s) => ({
                value: s,
                label:
                  s === "CHECKED_IN" ? "Inside" : s === "CHECKED_OUT" ? "Checked Out" : s === "EXPECTED" ? "Expected" : "Cancelled",
              }))}
              className="w-36"
            />
            <FilterSelect
              placeholder="Purpose"
              value={filters.purpose}
              onValueChange={(v) => setFilter("purpose", v)}
              options={VISIT_PURPOSES.map((p) => ({ value: p, label: p }))}
              className="w-36"
            />
            <FilterSelect
              placeholder="Host"
              value={filters.hostId}
              onValueChange={(v) => setFilter("hostId", v)}
              options={hosts}
              className="w-36"
            />
            <FilterSelect
              placeholder="Department"
              value={filters.department}
              onValueChange={(v) => setFilter("department", v)}
              options={departments.map((d) => ({ value: d, label: d }))}
              className="w-36"
            />
            <NativeSelect
              value={filters.sort}
              onChange={(e) => setFilter("sort", e.target.value)}
              className="h-9 w-40"
              aria-label="Sort"
            >
              <option value="createdAt_desc">Newest first</option>
              <option value="createdAt_asc">Oldest first</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="checkInTime_desc">Check-in (newest)</option>
            </NativeSelect>
            <Button
              asChild
              variant="outline"
              onClick={() => {
                if (data && data.total === 0) toast.error("No data to export");
              }}
            >
              <a href={exportUrl} download aria-disabled={data?.total === 0}>
                <Download className="size-4" /> Export CSV
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Visitor</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 11 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={11}>
                  <EmptyState
                    title="Could not load report"
                    description={error}
                    action={
                      <Button variant="outline" onClick={() => void fetchData(filters)}>
                        Try again
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : data && data.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11}>
                  <EmptyState
                    title="No results found"
                    description={
                      hasActiveFilters
                        ? "There are no visits matching your current filters."
                        : "There are no visits recorded yet."
                    }
                    action={
                      hasActiveFilters ? (
                        <Button variant="outline" onClick={clearFilters}>
                          <Trash2 className="mr-1 size-4" /> Clear Filters
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              data?.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell className="font-medium">{row.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{row.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{row.company ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{row.host?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{row.department ?? row.host?.department ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{row.customPurpose || row.purpose}</TableCell>
                  <TableCell>{row.checkInTime ? formatTime(row.checkInTime) : "—"}</TableCell>
                  <TableCell>{row.checkOutTime ? formatTime(row.checkOutTime) : "—"}</TableCell>
                  <TableCell>
                    {row.checkInTime
                      ? (row.checkOutTime ? formatDuration(row.checkInTime, row.checkOutTime) : "In progress")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing {from}–{to} of {total} visits
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className={cn("cursor-pointer", page <= 1 && "text-muted-foreground")}
                />
              </PaginationItem>
              {pageItems.map((p) => (
                <PaginationNumber key={p} page={p} current={page} onClick={setPage} />
              ))}
              <PaginationItem>
                <PaginationNext
                  disabled={page >= (data?.totalPages ?? 1)}
                  onClick={() => setPage(page + 1)}
                  className={cn("cursor-pointer", page >= (data?.totalPages ?? 1) && "text-muted-foreground")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

function formatDurationMs(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "<1m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}