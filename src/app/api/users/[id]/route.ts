import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { apiSuccess, handleApiError, apiError } from "@/lib/api";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/password";
import { writeAuditLog } from "@/lib/audit-log";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    email: z.string().email().optional(),
    role: z.enum(["ADMIN", "RECEPTIONIST", "SECURITY"]).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).optional(),
  })
  .strict();

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  try {
    const admin = await requireApiAuth("user:manage");
    const { id } = await ctx.params;
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    await dbConnect();
    const user = await User.findById(id).exec();
    if (!user) {
      return apiError("User not found", 404, "NOT_FOUND");
    }

    if (parsed.data.email && parsed.data.email !== user.email) {
      const dup = await User.findOne({ email: parsed.data.email }).exec();
      if (dup) {
        return apiError("A user with this email already exists", 409, "CONFLICT");
      }
    }

    const patch: Record<string, unknown> = {};
    if (parsed.data.name) patch.name = parsed.data.name;
    if (parsed.data.email) patch.email = parsed.data.email;
    if (parsed.data.role) patch.role = parsed.data.role;
    if (parsed.data.isActive !== undefined) patch.isActive = parsed.data.isActive;
    if (parsed.data.password) patch.passwordHash = hashPassword(parsed.data.password);

    const updated = await User.findByIdAndUpdate(id, { $set: patch }, { new: true })
      .lean()
      .exec();

    await writeAuditLog({
      action: "USER_UPDATED",
      entityType: "User",
      entityId: id,
      user: admin,
      metadata: { email: updated?.email, role: updated?.role },
    });

    return apiSuccess({
      id: String(updated?._id),
      email: updated?.email,
      name: updated?.name,
      role: updated?.role,
      isActive: updated?.isActive,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  try {
    const admin = await requireApiAuth("user:manage");
    const { id } = await ctx.params;

    await dbConnect();
    const user = await User.findById(id).exec();
    if (!user) {
      return apiError("User not found", 404, "NOT_FOUND");
    }
    if (String(user._id) === admin.id) {
      return apiError("You cannot delete your own account", 409, "CONFLICT");
    }

    await User.findByIdAndDelete(id).exec();
    await writeAuditLog({
      action: "USER_UPDATED",
      entityType: "User",
      entityId: id,
      user: admin,
      metadata: { email: user.email, deleted: true },
    });

    return apiSuccess({ id });
  } catch (error) {
    return handleApiError(error);
  }
}