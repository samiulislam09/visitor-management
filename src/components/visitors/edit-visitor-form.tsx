"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
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
import { PhotoUpload } from "./photo-upload";
import { Spinner } from "@/components/spinner";
import { visitorUpdateSchema } from "@/lib/validations/visitor";
import { ID_TYPES, VISIT_PURPOSES } from "@/lib/constants";

export interface HostOptionData {
  value: string;
  label: string;
  department?: string;
}

export interface EditVisitorData {
  id: string;
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
  hostId: string;
  department?: string;
  expectedDate?: string;
  expectedTime?: string;
  expectedDuration?: number;
  numberOfVisitors?: number;
  vehicleNumber?: string;
  notes?: string;
  status: string;
}

export function EditVisitorForm({
  visitor,
  hosts,
}: {
  visitor: EditVisitorData;
  hosts: HostOptionData[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(visitorUpdateSchema) as Resolver,
    defaultValues: {
      fullName: visitor.fullName,
      phone: visitor.phone,
      email: visitor.email ?? "",
      address: visitor.address ?? "",
      company: visitor.company ?? "",
      photoUrl: visitor.photoUrl,
      idType: visitor.idType,
      idNumber: visitor.idNumber ?? "",
      purpose: visitor.purpose,
      customPurpose: visitor.customPurpose ?? "",
      hostId: visitor.hostId,
      department: visitor.department ?? "",
      expectedDate: visitor.expectedDate?.slice(0, 10) ?? "",
      expectedTime: visitor.expectedTime ?? "",
      expectedDuration: visitor.expectedDuration,
      numberOfVisitors: visitor.numberOfVisitors,
      vehicleNumber: visitor.vehicleNumber ?? "",
      notes: visitor.notes ?? "",
    },
  });

  const watchPurpose = form.watch("purpose");
  const watchIdType = form.watch("idType");

  async function onSubmit(values: Record<string, unknown>) {
    setSubmitting(true);
    try {
      const payload = {
        fullName: values.fullName,
        phone: values.phone,
        email: (values.email as string) || undefined,
        address: (values.address as string) || undefined,
        company: (values.company as string) || undefined,
        photoUrl: values.photoUrl || undefined,
        idType: values.idType || undefined,
        idNumber: (values.idNumber as string) || undefined,
        purpose: values.purpose,
        customPurpose:
          values.purpose === "Other"
            ? (values.customPurpose as string) || undefined
            : undefined,
        hostId: values.hostId,
        department: (values.department as string) || undefined,
        expectedDate: (values.expectedDate as string) || undefined,
        expectedTime: (values.expectedTime as string) || undefined,
        expectedDuration: values.expectedDuration || undefined,
        numberOfVisitors: values.numberOfVisitors || undefined,
        vehicleNumber: (values.vehicleNumber as string) || undefined,
        notes: (values.notes as string) || undefined,
      };

      const res = await fetch(`/api/visitors/${visitor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body?.error?.message ?? "Failed to update visitor");
        return;
      }
      toast.success("Visitor updated successfully");
      router.push(`/visitors/${visitor.id}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <FormSection
            title="Visitor Information"
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
                      <Input {...field} />
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
                      <Input type="tel" {...field} />
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
                        <Input type="email" {...field} />
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
                        <Input {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo</FormLabel>
                    <FormControl>
                      <PhotoUpload value={field.value} onChange={field.onChange} />
                    </FormControl>
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
                        <Input disabled={!watchIdType} {...field} />
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
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="grid gap-4">
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
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Department (e.g. Engineering)" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave blank to use the host&apos;s department.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        <FormLabel>Duration (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={5}
                            max={720}
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
              </div>
            </FormSection>

            <FormSection
              title="Additional Information"
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
                          <Input {...field} />
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
                        <Textarea {...field} />
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
            <a href={`/visitors/${visitor.id}`}>Cancel</a>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Spinner className="size-4" /> : <Save className="size-4" />}
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}