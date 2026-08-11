import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api";
import { checkOutVisitor } from "@/lib/services/visitors";
import { checkOutSchema } from "@/lib/validations/visitor";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/visitors/[id]/check-out">) {
  try {
    const user = await requireApiAuth("visitor:checkout");
    const { id } = await ctx.params;
    const body = await request.json().catch(() => null);
    const parsed = checkOutSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }
    const checkOutTime = parsed.data.checkOutTime
      ? new Date(parsed.data.checkOutTime)
      : undefined;
    const visitor = await checkOutVisitor(id, checkOutTime, user);
    return apiSuccess(visitor);
  } catch (error) {
    return handleApiError(error);
  }
}