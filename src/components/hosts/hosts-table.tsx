"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Search, Pencil, Plus, Trash2, Save } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { ConfirmationDialog } from "@/components/confirm-dialog";
import { FilterSelect } from "@/components/filter-select";
import { hostSchema, type HostInput } from "@/lib/validations/host";
import { getInitials } from "@/lib/utils";
import { HOST_STATUSES } from "@/lib/constants";

export interface HostRow {
  id: string;
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  status: string;
}

interface HostListData {
  rows: HostRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type HostFormValues = Omit<HostInput, "status"> & { status: string };

function toFormValues(host: HostRow | null): HostFormValues {
  return {
    name: host?.name ?? "",
    email: host?.email ?? "",
    phone: host?.phone ?? "",
    department: host?.department ?? "",
    designation: host?.designation ?? "",
    employeeId: host?.employeeId ?? "",
    status: host?.status ?? "ACTIVE",
  };
}

export function HostsTable({
  canManage,
  initialHosts,
  initialTotal,
}: {
  canManage: boolean;
  initialHosts: HostRow[];
  initialTotal: number;
}) {
  const router = useRouter();
  const [data, setData] = React.useState<HostListData>({
    rows: initialHosts,
    total: initialTotal,
    page: 1,
    pageSize: 20,
    totalPages: Math.max(1, Math.ceil(initialTotal / 20)),
  });
  const [loading, setLoading] = React.useState(false);
  const [filters, setFilters] = React.useState<Record<string, string | undefined>>({
    search: "",
    status: undefined,
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<HostRow | null>(null);
  const [saving, setSaving] = React.useState(false);

  const fetchData = React.useCallback(
    async (next: Record<string, string | undefined>, page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: "20" });
        (Object.entries(next) as [string, string | undefined][]).forEach(([key, value]) => {
          if (value && value !== "all" && value !== "") params.set(key, value);
        });
        const res = await fetch(`/api/hosts?${params.toString()}`, { cache: "no-store" });
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? "Failed");
        setData(body.data);
      } catch {
        toast.error("Failed to load hosts");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
      void fetchData({ ...filters, search: value }, 1);
    }, 400);
  }

  function handleStatus(value: string) {
    const next = { ...filters, status: value === "all" ? undefined : value };
    setFilters(next);
    void fetchData(next, 1);
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(host: HostRow) {
    setEditing(host);
    setDialogOpen(true);
  }

  const form = useForm<HostFormValues>({
    resolver: zodResolver(hostSchema) as Resolver<HostFormValues>,
    defaultValues: toFormValues(editing),
  });

  React.useEffect(() => {
    form.reset(toFormValues(editing));
  }, [editing, form]);

  async function onSubmit(values: HostFormValues) {
    setSaving(true);
    try {
      const url = editing ? `/api/hosts/${editing.id}` : "/api/hosts";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body?.error?.message ?? "Failed to save host");
        return;
      }
      toast.success(editing ? "Host updated successfully" : "Host created successfully");
      setDialogOpen(false);
      void fetchData(filters);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteHost(host: HostRow) {
    try {
      const res = await fetch(`/api/hosts/${host.id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body?.error?.message ?? "Failed to delete host");
        return;
      }
      toast.success("Host deleted successfully");
      void fetchData(filters);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  const hasSearch = Boolean(filters.search);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, employee ID, department…"
            className="pl-9"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <FilterSelect
          placeholder="Status"
          value={filters.status}
          onValueChange={handleStatus}
          options={HOST_STATUSES.map((s) => ({ value: s, label: s === "ACTIVE" ? "Active" : "Inactive" }))}
          className="w-36"
        />
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add Host
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: (canManage ? 6 : 5) }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5}>
                  <EmptyState
                    title="No hosts found"
                    description={
                      hasSearch
                        ? "No employees match your search."
                        : "Add your first host so visitors can be assigned."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.rows.map((host) => (
                <TableRow key={host.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback>{getInitials(host.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{host.name}</p>
                        <p className="text-xs text-muted-foreground">{host.employeeId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{host.email ?? "—"}</div>
                    <div className="text-xs">{host.phone ?? ""}</div>
                  </TableCell>
                  <TableCell>{host.department ?? "—"}</TableCell>
                  <TableCell>{host.designation ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        host.status === "ACTIVE"
                          ? "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "border-transparent bg-muted text-muted-foreground"
                      }
                    >
                      {host.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(host)}>
                          <Pencil className="mr-1 size-4" /> Edit
                        </Button>
                        <ConfirmationDialog
                          trigger={
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="mr-1 size-4" /> Delete
                            </Button>
                          }
                          title="Delete Host?"
                          description={`Delete ${host.name}? Hosts with visitor records can be set to Inactive instead.`}
                          confirmLabel="Delete"
                          onConfirm={() => deleteHost(host)}
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.total > data.pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total} hosts
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => {
                const next = data.page - 1;
                void fetchData(filters, next);
              }}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages}
              onClick={() => {
                const next = data.page + 1;
                void fetchData(filters, next);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {canManage && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? `Edit ${editing.name}` : "Add New Host"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "Update this employee's details."
                  : "Create an employee who will receive visitors."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ahmed Rahman" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee ID *</FormLabel>
                        <FormControl>
                          <Input placeholder="EMP-0012" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="ahmed@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+8801712345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input placeholder="Engineering" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation</FormLabel>
                        <FormControl>
                          <Input placeholder="Senior Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    <Save className="size-4" />
                    {saving ? "Saving…" : editing ? "Save changes" : "Create host"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}