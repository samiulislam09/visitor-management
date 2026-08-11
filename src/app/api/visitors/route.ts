import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api";
import { listVisitors, createVisitor } from "@/lib/services/visitors";
import { visitorSchema } from "@/lib/validations/visitor";
import { parsePositiveInt } from "@/lib/utils";
import { SORT_OPTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireApiAuth("visitor:read");
    const { searchParams } = new URL(request.url);

    const sortValue = searchParams.get("sort");
    const sort = SORT_OPTIONS.some((o) => o.value === sortValue)
      ? (sortValue as (typeof SORT_OPTIONS)[number]["value"])
      : undefined;

    const data = await listVisitors({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      purpose: searchParams.get("purpose") ?? undefined,
      hostId: searchParams.get("hostId") ?? undefined,
      department: searchParams.get("department") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      page: parsePositiveInt(searchParams.get("page"), 1),
      pageSize: parsePositiveInt(searchParams.get("pageSize"), 20),
      sort,
    });

    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiAuth("visitor:create");
    const body = await request.json();
    const parsed = visitorSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    const visitor = await createVisitor(parsed.data, user);
    return apiSuccess(visitor, 201);
  } catch (error) {
    return handleApiError(error);
  }
}