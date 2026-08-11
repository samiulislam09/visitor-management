import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api";
import { cancelVisitor } from "@/lib/services/visitors";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/visitors/[id]/cancel">) {
  try {
    const user = await requireApiAuth("visitor:update");
    const { id } = await ctx.params;
    const visitor = await cancelVisitor(id, user);
    return apiSuccess(visitor);
  } catch (error) {
    return handleApiError(error);
  }
}