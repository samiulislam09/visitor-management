import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api";
import { getHostById, updateHost, deleteHost } from "@/lib/services/hosts";
import { hostUpdateSchema } from "@/lib/validations/host";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/hosts/[id]">) {
  try {
    await requireApiAuth("host:read");
    const { id } = await ctx.params;
    const host = await getHostById(id);
    return apiSuccess(host);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/hosts/[id]">) {
  try {
    const user = await requireApiAuth("host:manage");
    const { id } = await ctx.params;
    const body = await request.json();
    const parsed = hostUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }
    const host = await updateHost(id, parsed.data, user);
    return apiSuccess(host);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/hosts/[id]">) {
  try {
    const user = await requireApiAuth("host:manage");
    const { id } = await ctx.params;
    const result = await deleteHost(id, user);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}