import "server-only";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { Visitor } from "@/models/Visitor";
import { mapListRow, type VisitorListRow } from "@/lib/services/visitors";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  hostId?: string;
  department?: string;
  purpose?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export function buildReportMatch(filters: ReportFilters): Record<string, unknown> {
  const match: Record<string, unknown> = {};

  if (filters.search) {
    const q = filters.search.trim();
    if (q) {
      match.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { visitorId: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
      ];
    }
  }
  if (filters.status) match.status = filters.status;
  if (filters.purpose) match.purpose = filters.purpose;
  if (filters.department) match.department = filters.department;
  if (filters.hostId && mongoose.isValidObjectId(filters.hostId)) {
    match.hostId = new mongoose.Types.ObjectId(filters.hostId);
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

function resolveReportSort(sort: string | undefined): Record<string, 1 | -1> {
  switch (sort) {
    case "createdAt_asc":
      return { createdAt: 1 };
    case "checkInTime_desc":
      return { checkInTime: -1, createdAt: -1 };
    case "checkInTime_asc":
      return { checkInTime: 1, createdAt: 1 };
    case "name_asc":
      return { fullName: 1 };
    case "name_desc":
      return { fullName: -1 };
    case "duration_desc":
      return { checkInTime: -1 };
    case "createdAt_desc":
    default:
      return { createdAt: -1 };
  }
}

const REPORT_PROJECTION: Record<string, 1> = {
  host: 1,
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
};

const REPORT_LOOKUP = [
  {
    $lookup: {
      from: "hosts",
      localField: "hostId",
      foreignField: "_id",
      as: "host",
    },
  },
  { $unwind: { path: "$host", preserveNullAndEmptyArrays: true } },
  { $project: REPORT_PROJECTION },
];

export async function listReports(filters: ReportFilters) {
  await dbConnect();
  const page = (filters.page ?? 1) > 0 ? filters.page! : 1;
  const pageSize =
    filters.pageSize && filters.pageSize > 0
      ? Math.min(filters.pageSize, 100)
      : DEFAULT_PAGE_SIZE;

  const match = buildReportMatch(filters);
  const sort = resolveReportSort(filters.sort);

  const [result] = await Visitor.aggregate([
    { $match: match },
    ...REPORT_LOOKUP,
    {
      $facet: {
        rows: [{ $sort: sort }, { $skip: (page - 1) * pageSize }, { $limit: pageSize }],
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

export async function getReportSummary(filters: ReportFilters) {
  await dbConnect();
  const match = buildReportMatch(filters);

  const [result] = await Visitor.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalVisits: { $sum: 1 },
        totalCheckins: {
          $sum: { $cond: [{ $ne: ["$checkInTime", null] }, 1, 0] },
        },
        totalCheckouts: {
          $sum: { $cond: [{ $ne: ["$checkOutTime", null] }, 1, 0] },
        },
        currentlyInside: {
          $sum: { $cond: [{ $eq: ["$status", "CHECKED_IN"] }, 1, 0] },
        },
        avgDurationMs: {
          $avg: {
            $cond: [
              {
                $and: [{ $ne: ["$checkInTime", null] }, { $ne: ["$checkOutTime", null] }],
              },
              { $subtract: ["$checkOutTime", "$checkInTime"] },
              null,
            ],
          },
        },
        expected: {
          $sum: { $cond: [{ $eq: ["$status", "EXPECTED"] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
        },
      },
    },
  ]);

  if (!result || !result._id) {
    return {
      totalVisits: 0,
      totalCheckins: 0,
      totalCheckouts: 0,
      currentlyInside: 0,
      expected: 0,
      cancelled: 0,
      avgDurationMs: null,
    };
  }

  return {
    totalVisits: result.totalVisits,
    totalCheckins: result.totalCheckins,
    totalCheckouts: result.totalCheckouts,
    currentlyInside: result.currentlyInside,
    expected: result.expected,
    cancelled: result.cancelled,
    avgDurationMs: result.avgDurationMs,
  };
}

export async function exportReports(filters: ReportFilters): Promise<VisitorListRow[]> {
  await dbConnect();
  const match = buildReportMatch(filters);
  const sort = resolveReportSort(filters.sort);

  const docs = await Visitor.aggregate<Record<string, unknown>>([
    { $match: match },
    ...REPORT_LOOKUP,
    { $sort: sort },
  ]);

  return docs.map(mapListRow);
}