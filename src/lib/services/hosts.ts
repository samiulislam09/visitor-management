import "server-only";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { Host } from "@/models/Host";
import { Visitor } from "@/models/Visitor";
import { ApiError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit-log";
import type { SessionUser } from "@/lib/auth";
import type { HostInput, HostUpdateInput } from "@/lib/validations/host";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export interface HostListFilters {
  search?: string;
  status?: string;
  department?: string;
  page?: number;
  pageSize?: number;
}

export function mapHost(doc: Record<string, unknown>) {
  return {
    id: String(doc._id),
    employeeId: String(doc.employeeId ?? ""),
    name: String(doc.name ?? ""),
    email: doc.email ? String(doc.email) : undefined,
    phone: String(doc.phone ?? ""),
    department: doc.department ? String(doc.department) : undefined,
    designation: doc.designation ? String(doc.designation) : undefined,
    status: String(doc.status ?? "ACTIVE"),
    createdAt: new Date(doc.createdAt as string | Date).toISOString(),
    updatedAt: new Date(doc.updatedAt as string | Date).toISOString(),
  };
}

export type HostData = ReturnType<typeof mapHost>;

export async function listHosts(filters: HostListFilters) {
  await dbConnect();
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize =
    filters.pageSize && filters.pageSize > 0 ? Math.min(filters.pageSize, 100) : DEFAULT_PAGE_SIZE;

  const match: Record<string, unknown> = {};
  if (filters.search) {
    const q = filters.search.trim();
    if (q) {
      match.$or = [
        { name: { $regex: q, $options: "i" } },
        { employeeId: { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }
  }
  if (filters.status) match.status = filters.status;
  if (filters.department) match.department = filters.department;

  const [total, rows] = await Promise.all([
    Host.countDocuments(match),
    Host.find(match)
      .sort({ name: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()
      .exec(),
  ]);

  return {
    rows: rows.map((h) => mapHost(h as unknown as Record<string, unknown>)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getHostById(id: string) {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError("Invalid host ID", 400, "INVALID_ID");
  }
  const host = await Host.findById(id).lean().exec();
  if (!host) {
    throw new ApiError("Host not found", 404, "NOT_FOUND");
  }
  return mapHost(host as unknown as Record<string, unknown>);
}

export async function listActiveHosts() {
  await dbConnect();
  const hosts = await Host.find({ status: "ACTIVE" })
    .sort({ name: 1 })
    .lean()
    .exec();
  return hosts.map((h) => mapHost(h as unknown as Record<string, unknown>));
}

export async function createHost(input: HostInput, user: SessionUser | null) {
  await dbConnect();

  if (input.employeeId) {
    const existing = await Host.findOne({ employeeId: input.employeeId }).exec();
    if (existing) {
      throw new ApiError(
        `A host with employee ID "${input.employeeId}" already exists`,
        409,
        "CONFLICT"
      );
    }
  }

  const host = await Host.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    department: input.department,
    designation: input.designation,
    employeeId: input.employeeId,
    status: input.status ?? "ACTIVE",
  });

  await writeAuditLog({
    action: "HOST_CREATED",
    entityType: "Host",
    entityId: String(host._id),
    user,
    metadata: { name: host.name, employeeId: host.employeeId },
  });

  return getHostById(String(host._id));
}

export async function updateHost(
  id: string,
  input: HostUpdateInput,
  user: SessionUser | null
) {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError("Invalid host ID", 400, "INVALID_ID");
  }
  const existing = await Host.findById(id).exec();
  if (!existing) {
    throw new ApiError("Host not found", 404, "NOT_FOUND");
  }

  if (input.employeeId && input.employeeId !== existing.employeeId) {
    const dup = await Host.findOne({ employeeId: input.employeeId }).exec();
    if (dup) {
      throw new ApiError(
        `A host with employee ID "${input.employeeId}" already exists`,
        409,
        "CONFLICT"
      );
    }
  }

  const patch: Record<string, unknown> = {};
  const fields: (keyof HostUpdateInput)[] = [
    "name",
    "email",
    "phone",
    "department",
    "designation",
    "employeeId",
    "status",
  ];
  for (const field of fields) {
    if (field in input) {
      patch[field] = input[field];
    }
  }

  const updated = await Host.findByIdAndUpdate(id, { $set: patch }, { new: true })
    .exec();

  await writeAuditLog({
    action: "HOST_UPDATED",
    entityType: "Host",
    entityId: id,
    user,
    metadata: { name: updated?.name },
  });

  return getHostById(id);
}

export async function deleteHost(id: string, user: SessionUser | null) {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError("Invalid host ID", 400, "INVALID_ID");
  }
  const host = await Host.findById(id).exec();
  if (!host) {
    throw new ApiError("Host not found", 404, "NOT_FOUND");
  }

  const visitorCount = await Visitor.countDocuments({ hostId: host._id });
  if (visitorCount > 0) {
    throw new ApiError(
      `This host has ${visitorCount} visitor record(s) and cannot be deleted. Set them to INACTIVE instead.`,
      409,
      "CONFLICT"
    );
  }

  await Host.findByIdAndDelete(id).exec();

  await writeAuditLog({
    action: "HOST_DELETED",
    entityType: "Host",
    entityId: id,
    user,
    metadata: { name: host.name, employeeId: host.employeeId },
  });

  return { id, name: host.name };
}

export async function listHostDepartments(): Promise<string[]> {
  await dbConnect();
  const results = await Host.distinct("department");
  return results.filter(Boolean).sort();
}