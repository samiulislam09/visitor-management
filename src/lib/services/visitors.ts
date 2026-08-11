import "server-only";
import mongoose from "mongoose";
import type { ClientSession } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { Visitor, type VisitorDocument } from "@/models/Visitor";
import { Host } from "@/models/Host";
import { Counter } from "@/models/Counter";
import { ApiError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit-log";
import type { SessionUser } from "@/lib/auth";
import type { VisitorInput, VisitorUpdateInput } from "@/lib/validations/visitor";
import type { SortOption } from "@/lib/constants";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export interface VisitorListFilters {
  search?: string;
  status?: string;
  purpose?: string;
  hostId?: string;
  department?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sort?: SortOption;
}

export interface HostInfo {
  id: string;
  name: string;
  department?: string;
  designation?: string;
}

export interface VisitorListRow {
  id: string;
  visitorId: string;
  fullName: string;
  phone: string;
  company?: string;
  photoUrl?: string;
  purpose: string;
  customPurpose?: string;
  department?: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  expectedDate?: string;
  host?: HostInfo;
  createdAt: string;
}

export function toHostInfo(host: unknown): HostInfo | undefined {
  if (!host || typeof host !== "object") return undefined;
  const h = host as {
    _id?: { toString(): string } | string;
    id?: string;
    name?: string;
    department?: string;
    designation?: string;
  };
  return {
    id: String(h._id ?? h.id ?? ""),
    name: h.name ?? "Unknown",
    department: h.department,
    designation: h.designation,
  };
}

function buildListMatch(filters: VisitorListFilters): Record<string, unknown> {
  const match: Record<string, unknown> = {};

  if (filters.search) {
    const q = filters.search.trim();
    if (q) {
      match.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { visitorId: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } },
      ];
    }
  }

  if (filters.status) {
    match.status = filters.status;
  }
  if (filters.purpose) {
    match.purpose = filters.purpose;
  }
  if (filters.hostId && mongoose.isValidObjectId(filters.hostId)) {
    match.hostId = new mongoose.Types.ObjectId(filters.hostId);
  }
  if (filters.department) {
    match.department = filters.department;
  }
  if (filters.dateFrom || filters.dateTo) {
    const range: Record<string, Date> = {};
    if (filters.dateFrom) {
      range.$gte = new Date(`${filters.dateFrom}T00:00:00`);
    }
    if (filters.dateTo) {
      range.$lte = new Date(`${filters.dateTo}T23:59:59.999`);
    }
    match.createdAt = range;
  }

  return match;
}

function resolveSort(sort: SortOption | string | undefined): Record<string, 1 | -1> {
  switch (sort) {
    case "createdAt_asc":
      return { createdAt: 1 };
    case "name_asc":
      return { fullName: 1 as const };
    case "name_desc":
      return { fullName: -1 as const };
    case "checkInTime_desc":
      return { checkInTime: -1 as const, createdAt: -1 as const };
    case "checkInTime_asc":
      return { checkInTime: 1 as const, createdAt: 1 as const };
    case "createdAt_desc":
    default:
      return { createdAt: -1 as const };
  }
}

export function mapListRow(doc: Record<string, unknown>): VisitorListRow {
  return {
    id: String(doc._id),
    visitorId: String(doc.visitorId ?? ""),
    fullName: String(doc.fullName ?? ""),
    phone: String(doc.phone ?? ""),
    company: doc.company ? String(doc.company) : undefined,
    photoUrl: doc.photoUrl ? String(doc.photoUrl) : undefined,
    purpose: String(doc.purpose ?? ""),
    customPurpose: doc.customPurpose ? String(doc.customPurpose) : undefined,
    department: doc.department ? String(doc.department) : undefined,
    status: String(doc.status ?? "") as VisitorListRow["status"],
    checkInTime: doc.checkInTime ? new Date(doc.checkInTime as string | Date).toISOString() : undefined,
    checkOutTime: doc.checkOutTime ? new Date(doc.checkOutTime as string | Date).toISOString() : undefined,
    expectedDate: doc.expectedDate ? new Date(doc.expectedDate as string | Date).toISOString() : undefined,
    host: toHostInfo(doc.host),
    createdAt: new Date(doc.createdAt as string | Date).toISOString(),
  };
}

export async function listVisitors(filters: VisitorListFilters) {
  await dbConnect();
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize =
    filters.pageSize && filters.pageSize > 0 ? Math.min(filters.pageSize, 100) : DEFAULT_PAGE_SIZE;

  const match = buildListMatch(filters);
  const sort = resolveSort(filters.sort);

  const [result] = await Visitor.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "hosts",
        localField: "hostId",
        foreignField: "_id",
        as: "host",
      },
    },
    { $unwind: { path: "$host", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        host: { _id: 1, name: 1, department: 1, designation: 1 },
        visitorId: 1,
        fullName: 1,
        phone: 1,
        company: 1,
        photoUrl: 1,
        purpose: 1,
        customPurpose: 1,
        department: 1,
        status: 1,
        checkInTime: 1,
        checkOutTime: 1,
        expectedDate: 1,
        createdAt: 1,
      },
    },
    {
      $facet: {
        rows: [
          { $sort: sort },
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  const rows = (result?.rows ?? []).map(mapListRow);
  const total = result?.total?.[0]?.count ?? 0;

  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getVisitorById(id: string) {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError("Invalid visitor ID", 400, "INVALID_ID");
  }

  const [result] = await Visitor.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: "hosts",
        localField: "hostId",
        foreignField: "_id",
        as: "host",
      },
    },
    { $unwind: { path: "$host", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        host: {
          _id: 1,
          name: 1,
          department: 1,
          designation: 1,
          phone: 1,
          email: 1,
          employeeId: 1,
          status: 1,
        },
        visitorId: 1,
        hostId: 1,
        fullName: 1,
        phone: 1,
        email: 1,
        address: 1,
        company: 1,
        photoUrl: 1,
        idType: 1,
        idNumber: 1,
        purpose: 1,
        customPurpose: 1,
        department: 1,
        expectedDate: 1,
        expectedTime: 1,
        expectedDuration: 1,
        numberOfVisitors: 1,
        vehicleNumber: 1,
        notes: 1,
        status: 1,
        checkInTime: 1,
        checkOutTime: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!result) {
    throw new ApiError("Visitor not found", 404, "NOT_FOUND");
  }

  return {
    ...result,
    id: String(result._id),
    host: toHostInfo(result.host),
  };
}

async function nextVisitorNumber(session?: ClientSession): Promise<number> {
  await dbConnect();
  const today = new Date();
  const datePart =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  const counter = await Counter.findOneAndUpdate(
    { _id: `visitor-${datePart}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session, setDefaultsOnInsert: true }
  );
  return counter.seq;
}

export function formatVisitorId(seq: number, date = new Date()): string {
  const datePart =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  return `VIS-${datePart}-${String(seq).padStart(5, "0")}`;
}

async function validateHost(hostId: string, session?: ClientSession) {
  await dbConnect();
  if (!mongoose.isValidObjectId(hostId)) {
    throw new ApiError("Host is not valid", 422, "VALIDATION_ERROR", {
      path: "hostId",
    });
  }
  const host = await Host.findById(hostId).session(session ?? null).exec();
  if (!host) {
    throw new ApiError("Selected host does not exist", 404, "NOT_FOUND");
  }
  if (host.status === "INACTIVE") {
    throw new ApiError("Inactive hosts cannot receive new visitors", 409, "CONFLICT");
  }
  return host;
}

function defaultExpectedDate(input: VisitorInput): Date | undefined {
  const norm = (v: string) => v.trim();
  if (input.checkInStatus === "CHECK_IN") {
    return new Date();
  }
  if (input.expectedDate) {
    return new Date(norm(input.expectedDate));
  }
  return undefined;
}

export async function createVisitor(input: VisitorInput, user: SessionUser | null) {
  await dbConnect();

  const session = await mongoose.startSession();
  try {
    const createdVisitors = await session.withTransaction(async () => {
      await validateHost(input.hostId, session);

      const seq = await nextVisitorNumber(session);
      const visitorId = formatVisitorId(seq);

      const arrivingNow = input.checkInStatus === "CHECK_IN";
      const status = arrivingNow ? "CHECKED_IN" : "EXPECTED";
      const checkInTime = arrivingNow ? new Date() : undefined;
      const expectedDate = defaultExpectedDate(input);

      const created = (await Visitor.create(
        [
          {
            visitorId,
            fullName: input.fullName,
            phone: input.phone,
            email: input.email,
            address: input.address,
            company: input.company,
            photoUrl: input.photoUrl,
            idType: input.idType,
            idNumber: input.idNumber,
            purpose: input.purpose,
            customPurpose: input.customPurpose,
            hostId: input.hostId,
            department: input.department,
            expectedDate,
            expectedTime: input.expectedTime,
            expectedDuration: input.expectedDuration,
            numberOfVisitors: input.numberOfVisitors,
            vehicleNumber: input.vehicleNumber,
            notes: input.notes,
            status,
            checkInTime,
          },
        ],
        { session }
      )) as unknown as VisitorDocument[];
      return created;
    });

    const created = createdVisitors?.[0];
    if (!created) {
      throw new ApiError("Could not create visitor", 500, "INTERNAL_ERROR");
    }

    await writeAuditLog({
      action: "VISITOR_CREATED",
      entityType: "Visitor",
      entityId: String(created._id),
      user,
      metadata: {
        visitorId: created.visitorId,
        status: created.status,
        purpose: created.purpose,
      },
    });

    return getVisitorById(String(created._id));
  } finally {
    await session.endSession();
  }
}

export async function updateVisitor(
  id: string,
  input: VisitorUpdateInput,
  user: SessionUser | null
) {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError("Invalid visitor ID", 400, "INVALID_ID");
  }

  const existing = await Visitor.findById(id).exec();
  if (!existing) {
    throw new ApiError("Visitor not found", 404, "NOT_FOUND");
  }

  if (input.hostId) {
    await validateHost(input.hostId);
  }

  const patch: Record<string, unknown> = {};
  const fields: (keyof VisitorUpdateInput)[] = [
    "fullName",
    "phone",
    "email",
    "address",
    "company",
    "photoUrl",
    "idType",
    "idNumber",
    "purpose",
    "customPurpose",
    "hostId",
    "department",
    "expectedTime",
    "expectedDuration",
    "numberOfVisitors",
    "vehicleNumber",
    "notes",
  ];
  for (const field of fields) {
    if (field in input) {
      patch[field] = input[field];
    }
  }
  if (input.expectedDate !== undefined) {
    patch.expectedDate = input.expectedDate ? new Date(input.expectedDate) : undefined;
  }

  const updated = await Visitor.findByIdAndUpdate(id, { $set: patch }, { new: true })
    .exec();

  await writeAuditLog({
    action: "VISITOR_UPDATED",
    entityType: "Visitor",
    entityId: id,
    user,
    metadata: { visitorId: updated?.visitorId },
  });

  return getVisitorById(id);
}

export async function checkInVisitor(
  id: string,
  checkInTime?: Date,
  user?: SessionUser | null
) {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError("Invalid visitor ID", 400, "INVALID_ID");
  }

  const visitor = await Visitor.findById(id).exec();
  if (!visitor) {
    throw new ApiError("Visitor not found", 404, "NOT_FOUND");
  }

  if (visitor.status === "CHECKED_IN") {
    throw new ApiError("Visitor is already checked in", 409, "CONFLICT");
  }
  if (visitor.status === "CHECKED_OUT") {
    throw new ApiError("Visitor has already checked out and cannot be checked in again", 409, "CONFLICT");
  }
  if (visitor.status === "CANCELLED") {
    throw new ApiError("Cancelled visitors cannot be checked in", 409, "CONFLICT");
  }

  const time = checkInTime ?? new Date();

  const updated = await Visitor.findByIdAndUpdate(
    id,
    { $set: { status: "CHECKED_IN", checkInTime: time } },
    { new: true }
  ).exec();

  await writeAuditLog({
    action: "VISITOR_CHECKED_IN",
    entityType: "Visitor",
    entityId: id,
    user,
    metadata: { visitorId: updated?.visitorId, checkInTime: time.toISOString() },
  });

  return getVisitorById(id);
}

export async function checkOutVisitor(
  id: string,
  checkOutTime?: Date,
  user?: SessionUser | null
) {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError("Invalid visitor ID", 400, "INVALID_ID");
  }

  const visitor = await Visitor.findById(id).exec();
  if (!visitor) {
    throw new ApiError("Visitor not found", 404, "NOT_FOUND");
  }

  if (visitor.status === "CHECKED_OUT") {
    throw new ApiError("Visitor has already checked out", 409, "CONFLICT");
  }
  if (visitor.status !== "CHECKED_IN") {
    throw new ApiError("Visitor must be checked in before checking out", 409, "CONFLICT");
  }

  const time = checkOutTime ?? new Date();
  if (visitor.checkInTime && time < visitor.checkInTime) {
    throw new ApiError(
      "Check-out time cannot be before check-in time",
      422,
      "VALIDATION_ERROR"
    );
  }

  const updated = await Visitor.findByIdAndUpdate(
    id,
    { $set: { status: "CHECKED_OUT", checkOutTime: time } },
    { new: true }
  ).exec();

  await writeAuditLog({
    action: "VISITOR_CHECKED_OUT",
    entityType: "Visitor",
    entityId: id,
    user,
    metadata: {
      visitorId: updated?.visitorId,
      checkOutTime: time.toISOString(),
    },
  });

  return getVisitorById(id);
}

export async function cancelVisitor(id: string, user?: SessionUser | null) {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError("Invalid visitor ID", 400, "INVALID_ID");
  }

  const visitor = await Visitor.findById(id).exec();
  if (!visitor) {
    throw new ApiError("Visitor not found", 404, "NOT_FOUND");
  }

  if (visitor.status === "CHECKED_IN" || visitor.status === "CHECKED_OUT") {
    throw new ApiError(
      "Cannot cancel a visitor that has already been checked in",
      409,
      "CONFLICT"
    );
  }

  const updated = await Visitor.findByIdAndUpdate(
    id,
    { $set: { status: "CANCELLED" } },
    { new: true }
  ).exec();

  await writeAuditLog({
    action: "VISITOR_CANCELLED",
    entityType: "Visitor",
    entityId: id,
    user,
    metadata: { visitorId: updated?.visitorId },
  });

  return getVisitorById(id);
}

export async function deleteVisitor(id: string, user: SessionUser | null) {
  await dbConnect();
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError("Invalid visitor ID", 400, "INVALID_ID");
  }

  const visitor = await Visitor.findById(id).exec();
  if (!visitor) {
    throw new ApiError("Visitor not found", 404, "NOT_FOUND");
  }

  await Visitor.findByIdAndDelete(id).exec();

  await writeAuditLog({
    action: "VISITOR_DELETED",
    entityType: "Visitor",
    entityId: id,
    user,
    metadata: { visitorId: visitor.visitorId, fullName: visitor.fullName },
  });

  return { id, visitorId: visitor.visitorId };
}

export async function listDepartments(): Promise<string[]> {
  await dbConnect();
  const results = await Visitor.distinct("department");
  return results.filter(Boolean).sort();
}