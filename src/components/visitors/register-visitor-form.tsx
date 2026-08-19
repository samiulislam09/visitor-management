"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CheckCircle2,
  Printer,
  UserPlus,
  LayoutDashboard,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSection,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PhotoUpload } from "./photo-upload";
import { Spinner } from "@/components/spinner";
import { formatDateTime, formatTime } from "@/lib/utils";
import { ID_TYPES, VISIT_PURPOSES } from "@/lib/constants";
import { visitorSchema } from "@/lib/validations/visitor";

type FormValues = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  company: string;
  photoUrl?: string;
  idType?: string;
  idNumber: string;
  purpose: string;
  customPurpose: string;
  hostId: string;
  department: string;
  expectedDate: string;
  expectedTime: string;
  expectedDuration?: number;
  numberOfVisitors?: number;
  vehicleNumber: string;
  notes: string;
  checkInStatus: "CHECK_IN" | "EXPECTED";
};

export interface HostOptionData {
  value: string;
  label: string;
  department?: string;
}

interface CreatedVisitor {
  id: string;
  fullName: string;
  phone?: string;
  visitorId: string;
  purpose?: string;
  customPurpose?: string;
  host?: { name?: string };
  status: string;
  checkInTime?: string;
}

export function RegisterVisitorForm({ hosts }: { hosts: HostOptionData[] }) {
  const [created, setCreated] = React.useState<CreatedVisitor | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(visitorSchema) as Resolver<FormValues>,
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      address: "",
      company: "",
      photoUrl: undefined,
      idType: undefined,
      idNumber: "",
      purpose: "Meeting",
      customPurpose: "",
      hostId: "",
      department: "",
      expectedDate: new Date().toISOString().slice(0, 10),
      expectedTime: "",
      expectedDuration: undefined,
      numberOfVisitors: undefined,
      vehicleNumber: "",
      notes: "",
      checkInStatus: "CHECK_IN",
    },
  });

  const watchPurpose = form.watch("purpose");
  const watchIdType = form.watch("idType");
  const watchCheckInStatus = form.watch("checkInStatus");
  const watchHostId = form.watch("hostId");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload = {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        address: values.address || undefined,
        company: values.company || undefined,
        photoUrl: values.photoUrl || undefined,
        idType: values.idType || undefined,
        idNumber: values.idNumber || undefined,
        purpose: values.purpose,
        customPurpose:
          values.purpose === "Other" ? values.customPurpose || undefined : undefined,
        hostId: values.hostId,
        department: values.department || undefined,
        expectedDate: values.expectedDate || undefined,
        expectedTime: values.expectedTime || undefined,
        expectedDuration: values.expectedDuration || undefined,
        numberOfVisitors: values.numberOfVisitors || undefined,
        vehicleNumber: values.vehicleNumber || undefined,
        notes: values.notes || undefined,
        checkInStatus: values.checkInStatus,
      };

      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body?.error?.message ?? "Failed to register visitor");
        return;
      }
      toast.success(
        values.checkInStatus === "CHECK_IN"
          ? "Visitor checked in successfully"
          : "Visitor registered as expected"
      );
      setCreated(body.data);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    form.reset();
    setCreated(null);
  }

  if (created) {
    return <RegistrationSuccess visitor={created} onReset={resetForm} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <FormSection
            title="Visitor Information"
            description="Basic details about the person visiting."
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" autoComplete="off" {...field} />
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
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="+8801712345678" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company / Organization</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Street, city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="idType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Type</FormLabel>
                      <Select
                        value={field.value ?? "none"}
                        onValueChange={(v) => field.onChange(v === "none" ? undefined : v)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {ID_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Document number"
                          disabled={!watchIdType}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormSection>

          <div className="grid gap-8">
            <FormSection
              title="Visit Information"
              description="Who they are meeting and when."
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="checkInStatus"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Arrival</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex flex-col gap-2 sm:flex-row sm:gap-4"
                          >
                            <label
                              className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-medium has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-ring"
                            >
                              <RadioGroupItem value="CHECK_IN" />
                              Checking in now
                            </label>
                            <label
                              className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-medium has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-ring"
                            >
                              <RadioGroupItem value="EXPECTED" />
                              Expected visitor
                            </label>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visit Purpose *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select purpose" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VISIT_PURPOSES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchPurpose === "Other" && (
                  <FormField
                    control={form.control}
                    name="customPurpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Purpose *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Product delivery" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="hostId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host / Employee *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the host" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hosts.map((h) => (
                            <SelectItem key={h.value} value={h.value}>
                              {h.label}
                              {h.department ? ` — ${h.department}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchHostId && (
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Department (e.g. Engineering)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave blank to use the host&apos;s department.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchCheckInStatus === "EXPECTED" && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="expectedDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expectedTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expectedDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Duration (min)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={5}
                              max={720}
                              placeholder="60"
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === "" ? undefined : Number(e.target.value)
                                )
                              }
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </FormSection>

            <FormSection
              title="Additional Information"
              description="Optional extra details."
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="numberOfVisitors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Visitors</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={1000}
                            placeholder="1"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? undefined : Number(e.target.value)
                              )
                            }
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicleNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. DM-A-12-3456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any additional notes about the visit…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button asChild type="button" variant="outline">
            <Link href="/visitors">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Spinner className="size-4" />
            ) : (
              <UserPlus className="size-4" />
            )}
            {submitting
              ? "Saving…"
              : watchCheckInStatus === "CHECK_IN"
                ? "Check In Visitor"
                : "Register Expected Visitor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function RegistrationSuccess({
  visitor,
  onReset,
}: {
  visitor: CreatedVisitor;
  onReset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border bg-card p-8 shadow-sm">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <CheckCircle2 className="size-12 text-emerald-600" />
        <h2 className="text-2xl font-semibold">Visitor Registered Successfully</h2>
        <p className="text-sm text-muted-foreground">
          <CalendarClock className="mr-1 inline size-4" />
          {visitor.status === "CHECKED_IN"
            ? `Checked in at ${visitor.checkInTime ? formatTime(visitor.checkInTime) : "—"}`
            : "Saved as an expected visitor"}
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border p-5">
        <div className="flex items-center justify-between border-b pb-3">
          <span className="text-sm text-muted-foreground">Visitor ID</span>
          <span className="font-mono text-sm font-semibold">{visitor.visitorId}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Name</span>
          <span className="font-medium">{visitor.fullName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Phone</span>
          <span className="font-medium">{visitor.phone ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Host</span>
          <span className="font-medium">{visitor.host?.name ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Purpose</span>
          <span className="font-medium">{visitor.customPurpose || visitor.purpose}</span>
        </div>
        {visitor.checkInTime && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Check-in</span>
            <span className="font-medium">{formatDateTime(visitor.checkInTime)}</span>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-2">
        <Button asChild>
          <Link href={`/visitors/${visitor.id}`}>
            View Visitor <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/visitors/${visitor.id}/pass`} target="_blank">
            <Printer className="size-4" /> Print Visitor Pass
          </Link>
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onReset}>
            <UserPlus className="size-4" /> Register Another
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard">
              <LayoutDashboard className="size-4" /> Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}