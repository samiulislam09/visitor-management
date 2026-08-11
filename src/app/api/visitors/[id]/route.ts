import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api";
import {
  getVisitorById,
  updateVisitor,
  deleteVisitor,
} from "@/lib/services/visitors";
import { visitorUpdateSchema } from "@/lib/validations/visitor";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/visitors/[id]">) {
  try {
    await requireApiAuth("visitor:read");
    const { id } = await ctx.params;
    const visitor = await getVisitorById(id);
    return apiSuccess(visitor);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/visitors/[id]">) {
  try {
    const user = await requireApiAuth("visitor:update");
    const { id } = await ctx.params;
    const body = await request.json();
    const parsed = visitorUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }
    const visitor = await updateVisitor(id, parsed.data, user);
    return apiSuccess(visitor);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/visitors/[id]">) {
  try {
    const user = await requireApiAuth("visitor:delete");
    const { id } = await ctx.params;
    const result = await deleteVisitor(id, user);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}