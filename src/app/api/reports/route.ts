import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api";
import { listReports, getReportSummary } from "@/lib/services/reports";
import { reportFilterSchema } from "@/lib/validations/report";
import { parsePositiveInt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireApiAuth("report:read");
    const { searchParams } = new URL(request.url);

    const raw = {
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      hostId: searchParams.get("hostId") ?? undefined,
      department: searchParams.get("department") ?? undefined,
      purpose: searchParams.get("purpose") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    };

    const parsed = reportFilterSchema.partial().safeParse(raw);
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    const filters = {
      ...parsed.data,
      page: parsePositiveInt(searchParams.get("page"), 1),
      pageSize: parsePositiveInt(searchParams.get("pageSize"), 20),
    };

    const [rowsData, summary] = await Promise.all([
      listReports(filters),
      getReportSummary(filters),
    ]);

    return apiSuccess({ ...rowsData, summary });
  } catch (error) {
    return handleApiError(error);
  }
}