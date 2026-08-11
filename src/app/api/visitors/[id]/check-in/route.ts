import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { apiSuccess, handleApiError } from "@/lib/api";
import { checkInVisitor } from "@/lib/services/visitors";
import { checkInSchema } from "@/lib/validations/visitor";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/visitors/[id]/check-in">) {
  try {
    const user = await requireApiAuth("visitor:checkin");
    const { id } = await ctx.params;
    const body = await request.json().catch(() => null);
    const parsed = checkInSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }
    const checkInTime = parsed.data.checkInTime ? new Date(parsed.data.checkInTime) : undefined;
    const visitor = await checkInVisitor(id, checkInTime, user);
    return apiSuccess(visitor);
  } catch (error) {
    return handleApiError(error);
  }
}