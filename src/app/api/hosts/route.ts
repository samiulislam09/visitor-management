import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api";
import { listHosts, createHost } from "@/lib/services/hosts";
import { hostSchema } from "@/lib/validations/host";
import { parsePositiveInt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireApiAuth("host:read");
    const { searchParams } = new URL(request.url);

    const filter = {
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      department: searchParams.get("department") ?? undefined,
      page: parsePositiveInt(searchParams.get("page"), 1),
      pageSize: parsePositiveInt(searchParams.get("pageSize"), 20),
    };

    if (filter.status === "all") filter.status = undefined;

    const data = await listHosts(filter);
    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiAuth("host:manage");
    const body = await request.json();
    const parsed = hostSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }
    const host = await createHost(parsed.data, user);
    return apiSuccess(host, 201);
  } catch (error) {
    return handleApiError(error);
  }
}