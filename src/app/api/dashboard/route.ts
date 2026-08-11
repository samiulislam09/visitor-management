import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api";
import {
  getDashboardStats,
  getVisitorsOverTime,
  getPurposeDistribution,
  getRecentVisitors,
} from "@/lib/services/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireApiAuth("dashboard:read");
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "7d";

    const [stats, trends, purposes, recent] = await Promise.all([
      getDashboardStats(),
      getVisitorsOverTime(),
      getPurposeDistribution(30),
      getRecentVisitors(8),
    ]);

    return apiSuccess({
      stats,
      trends: range === "today" ? { today: trends.today } : trends,
      purposes,
      recent,
    });
  } catch (error) {
    return handleApiError(error);
  }
}