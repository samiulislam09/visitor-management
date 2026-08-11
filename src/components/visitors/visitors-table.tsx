"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { toast } from "sonner";
import {
  Eye,
  Pencil,
  LogOut,
  LogIn,
  Trash2,
  MoreHorizontal,
  Search,
  ClipboardX,
} from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNumber,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ConfirmationDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { FilterSelect } from "@/components/filter-select";
import { NativeSelect } from "@/components/ui/native-select";
import { formatTime, getInitials, cn } from "@/lib/utils";
import { VISITOR_STATUSES, VISIT_PURPOSES, SORT_OPTIONS } from "@/lib/constants";
import type { VisitorListRow } from "@/lib/services/visitors";
import type { UserRole } from "@/lib/constants";

export interface HostOption {
  value: string;
  label: string;
}

interface VisitorListData {
  rows: VisitorListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function buildQuery(filters: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  (Object.entries(filters) as [string, string | undefined][]).forEach(([key, value]) => {
    if (value && value !== "all" && value !== "") {
      params.set(key, value);
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function VisitorsTable({
  initialStatus,
  role,
  hosts,
}: {
  initialStatus?: string;
  role: UserRole;
  hosts: HostOption[];
}) {
  const router = useRouter();
  const [data, setData] = React.useState<VisitorListData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [filters, setFilters] = React.useState<Record<string, string | undefined>>({
    search: "",
    status: initialStatus,
    purpose: undefined,
    hostId: undefined,
    department: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    sort: "createdAt_desc",
    page: "1",
  });

  const canCheckOut = ["ADMIN", "RECEPTIONIST", "SECURITY"].includes(role);
  const canDelete = role === "ADMIN";
  const canEdit = ["ADMIN", "RECEPTIONIST"].includes(role);

  const fetchData = React.useCallback(
    async (nextFilters: Record<string, string | undefined>) => {
      try {
        const res = await fetch(`/api/visitors${buildQuery(nextFilters)}`, {
          cache: "no-store",
        });
        const body = await res.json();
        if (!res.ok || !body.success) {
          throw new Error(body?.error?.message ?? "Failed to load visitors");
        }
        setData(body.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load visitors");
      } finally {
        setLoading(false);
      }
    },
    []
  );

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

  async function runAction(
    action: "check-out" | "check-in" | "cancel" | "delete",
    visitor: VisitorListRow
  ) {
    try {
      const res = await fetch(`/api/visitors/${visitor.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body?.error?.message ?? "Action failed");
        return;
      }
      toast.success(
        action === "check-out"
          ? "Visitor checked out successfully"
          : action === "check-in"
            ? "Visitor checked in successfully"
            : action === "cancel"
              ? "Visitor cancelled"
              : "Visitor deleted successfully"
      );
      void fetchData(filters);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
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
      key !== "sort" &&
      key !== "page" &&
      key !== "search" &&
      value !== undefined && value !== ""
  );

  const page = data?.page ?? 1;
  const pageSize = data?.pageSize ?? 20;
  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pageItems: number[] = [];
  if (data) {
    const totalPages = data.totalPages;
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pageItems.push(i);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, visitor ID, host, company…"
              className="pl-9"
              defaultValue={filters.search}
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              placeholder="Status"
              value={filters.status}
              onValueChange={(v) => setFilter("status", v)}
              options={VISITOR_STATUSES.map((s) => ({
                value: s,
                label:
                  s === "CHECKED_IN"
                    ? "Inside"
                    : s === "CHECKED_OUT"
                      ? "Checked Out"
                      : s === "EXPECTED"
                        ? "Expected"
                        : "Cancelled",
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
            <div className="flex items-center gap-2">
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
            </div>
            <NativeSelect
              value={filters.sort}
              onChange={(e) => setFilter("sort", e.target.value)}
              className="h-9 w-40"
              aria-label="Sort"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitor</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState
                    title="Could not load visitors"
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
                <TableCell colSpan={8}>
                  <EmptyState
                    title="No visitors found"
                    description={
                      hasActiveFilters
                        ? "There are no visitors matching your current filters."
                        : "There are no visitors yet. Register the first one to get started."
                    }
                    action={
                      hasActiveFilters ? (
                        <Button variant="outline" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              data?.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        {row.photoUrl && <AvatarImage src={row.photoUrl} alt={row.fullName} />}
                        <AvatarFallback>{getInitials(row.fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link
                          href={`/visitors/${row.id}`}
                          className="block max-w-40 truncate font-medium hover:underline"
                        >
                          {row.fullName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{row.visitorId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.phone}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="max-w-32 truncate">{row.host?.name ?? "—"}</div>
                    {row.host?.department && (
                      <div className="max-w-32 truncate text-xs text-muted-foreground">
                        {row.host.department}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="max-w-28 truncate">{row.customPurpose || row.purpose}</div>
                  </TableCell>
                  <TableCell>{row.checkInTime ? formatTime(row.checkInTime) : "—"}</TableCell>
                  <TableCell>{row.checkOutTime ? formatTime(row.checkOutTime) : "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <div className="hidden items-center gap-1 lg:flex">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/visitors/${row.id}`}><Eye className="mr-1" />View</Link>
                        </Button>
                        {canEdit && row.status !== "CHECKED_OUT" && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/visitors/${row.id}/edit`}>
                              <Pencil className="mr-1" />Edit
                            </Link>
                          </Button>
                        )}
                        {canCheckOut && row.status === "CHECKED_IN" && (
                          <ConfirmationDialog
                            trigger={
                              <Button variant="ghost" size="sm" className="text-emerald-600">
                                <LogOut className="mr-1" />Check Out
                              </Button>
                            }
                            title="Check Out Visitor?"
                            description={`Check out ${row.fullName} now?`}
                            confirmLabel="Check out"
                            destructive={false}
                            onConfirm={() => runAction("check-out", row)}
                          />
                        )}
                        {canDelete && (
                          <ConfirmationDialog
                            trigger={
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <Trash2 className="mr-1" />Delete
                              </Button>
                            }
                            title="Delete Visitor?"
                            description={`This will permanently delete ${row.fullName}'s record. This action cannot be undone.`}
                            confirmLabel="Delete"
                            onConfirm={() => runAction("delete", row)}
                          />
                        )}
                      </div>
                      <div className="lg:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{row.fullName}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/visitors/${row.id}`}><Eye /> View</Link>
                            </DropdownMenuItem>
                            {canEdit && row.status !== "CHECKED_OUT" && (
                              <DropdownMenuItem asChild>
                                <Link href={`/visitors/${row.id}/edit`}><Pencil /> Edit</Link>
                              </DropdownMenuItem>
                            )}
                            {row.status === "CHECKED_IN" && canCheckOut && (
                              <DropdownMenuItem onClick={() => void runAction("check-out", row)}>
                                <LogOut /> Check Out
                              </DropdownMenuItem>
                            )}
                            {row.status === "EXPECTED" && (
                              <DropdownMenuItem onClick={() => void runAction("check-in", row)}>
                                <LogIn /> Check In
                              </DropdownMenuItem>
                            )}
                            {row.status === "EXPECTED" && (
                              <ConfirmationDialog
                                trigger={
                                  <DropdownMenuItem
                                    onSelect={(e: Event) => e.preventDefault()}
                                    className="text-amber-600"
                                  >
                                    <ClipboardX /> Cancel Visitor
                                  </DropdownMenuItem>
                                }
                                title="Cancel Visitor?"
                                confirmLabel="Cancel visit"
                                destructive={false}
                                onConfirm={() => runAction("cancel", row)}
                              />
                            )}
                            {canDelete && (
                              <ConfirmationDialog
                                trigger={
                                  <DropdownMenuItem
                                    onSelect={(e: Event) => e.preventDefault()}
                                    className="text-destructive"
                                  >
                                    <Trash2 /> Delete
                                  </DropdownMenuItem>
                                }
                                title="Delete Visitor?"
                                confirmLabel="Delete"
                                onConfirm={() => runAction("delete", row)}
                              />
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
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
            Showing {from}–{to} of {total} visitors
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
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(page + 1)}
                  className={cn("cursor-pointer", page >= data.totalPages && "text-muted-foreground")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}