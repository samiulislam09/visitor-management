import "server-only";
import { dbConnect } from "@/lib/mongodb";
import { Visitor } from "@/models/Visitor";
import { mapListRow } from "@/lib/services/visitors";
import type { VisitorListRow } from "@/lib/services/visitors";

export function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export interface DashboardStats {
  todayVisitors: number;
  todayCheckins: number;
  todayCheckouts: number;
  currentlyInside: number;
  totalVisitors: number;
  expectedToday: number;
  cancelledToday: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await dbConnect();
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const [
    todayVisitors,
    todayCheckins,
    todayCheckouts,
    currentlyInside,
    totalVisitors,
    expectedToday,
    cancelledToday,
  ] = await Promise.all([
    Visitor.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
    Visitor.countDocuments({ checkInTime: { $gte: todayStart, $lte: todayEnd } }),
    Visitor.countDocuments({ checkOutTime: { $gte: todayStart, $lte: todayEnd } }),
    Visitor.countDocuments({ status: "CHECKED_IN" }),
    Visitor.countDocuments({}),
    Visitor.countDocuments({
      status: "EXPECTED",
      expectedDate: { $gte: todayStart, $lte: todayEnd },
    }),
    Visitor.countDocuments({
      status: "CANCELLED",
      createdAt: { $gte: todayStart, $lte: todayEnd },
    }),
  ]);

  return {
    todayVisitors,
    todayCheckins,
    todayCheckouts,
    currentlyInside,
    totalVisitors,
    expectedToday,
    cancelledToday,
  };
}

export interface TrendPoint {
  date: string;
  visits: number;
  checkins: number;
}

export interface Trends {
  today: TrendPoint[];
  last7Days: TrendPoint[];
  last30Days: TrendPoint[];
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function buildBucket(
  match: Record<string, unknown>
): Promise<Array<{ _id: Date; visits: number; checkins: number }>> {
  return Visitor.aggregate<{ _id: Date; visits: number; checkins: number }>([
    { $match: match },
    {
      $group: {
        _id: { $dateTrunc: { date: "$createdAt", unit: "day" } },
        visits: { $sum: 1 },
        checkins: {
          $sum: { $cond: [{ $ne: ["$checkInTime", null] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

function fillSeries(
  buckets: Array<{ _id: Date; visits: number; checkins: number }>,
  days: Date[]
): TrendPoint[] {
  const map = new Map(
    buckets.map((b) => [toDateKey(new Date(b._id)), b])
  );
  return days.map((day) => {
    const key = toDateKey(day);
    const found = map.get(key);
    return {
      date: key,
      visits: found?.visits ?? 0,
      checkins: found?.checkins ?? 0,
    };
  });
}

export async function getVisitorsOverTime(): Promise<Trends> {
  await dbConnect();

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const todayBuckets = await buildBucket({
    createdAt: { $gte: todayStart, $lte: todayEnd },
  });
  const todaySeries = fillSeries(todayBuckets, [todayStart]).map((p) => ({
    ...p,
    visits: p.visits,
  }));

  const sevenDays: Date[] = [];
  const thirtyDays: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    sevenDays.push(d);
  }
  for (let i = 29; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    thirtyDays.push(d);
  }

  const start7 = new Date(todayStart);
  start7.setDate(start7.getDate() - 6);
  const start30 = new Date(todayStart);
  start30.setDate(start30.getDate() - 29);

  const [sevenBuckets, thirtyBuckets] = await Promise.all([
    buildBucket({ createdAt: { $gte: start7, $lte: todayEnd } }),
    buildBucket({ createdAt: { $gte: start30, $lte: todayEnd } }),
  ]);

  return {
    today: todaySeries,
    last7Days: fillSeries(sevenBuckets, sevenDays),
    last30Days: fillSeries(thirtyBuckets, thirtyDays),
  };
}

export interface PurposeSlice {
  purpose: string;
  count: number;
}

export async function getPurposeDistribution(days = 30): Promise<PurposeSlice[]> {
  await dbConnect();
  const from = new Date();
  from.setDate(from.getDate() - days);

  const buckets = await Visitor.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: from } } },
    { $group: { _id: "$purpose", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return buckets.map((b) => ({ purpose: b._id, count: b.count }));
}

export async function getRecentVisitors(limit = 8): Promise<VisitorListRow[]> {
  await dbConnect();
  const docs = await Visitor.aggregate<Record<string, unknown>>([
    { $sort: { createdAt: -1, _id: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "hosts",
        localField: "hostId",
        foreignField: "_id",
        as: "host",
      },
    },
    { $unwind: { path: "$host", preserveNullAndEmptyArrays: true } },
    { $project: {
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
    } },
  ]);

  return docs.map(mapListRow);
}