import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { apiSuccess, handleApiError, apiError } from "@/lib/api";
import { createUserSchema } from "@/lib/validations/auth";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/password";
import { writeAuditLog } from "@/lib/audit-log";
import { parsePositiveInt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireApiAuth("user:manage");
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const pageSize = parsePositiveInt(searchParams.get("pageSize"), 50);

    const users = await User.find({})
      .sort({ createdAt: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()
      .exec();

    const total = await User.countDocuments();

    return apiSuccess({
      rows: users.map((u) => ({
        id: String(u._id),
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        createdAt: new Date(u.createdAt).toISOString(),
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiAuth("user:manage");
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    await dbConnect();
    const existing = await User.findOne({ email: parsed.data.email }).exec();
    if (existing) {
      return apiError("A user with this email already exists", 409, "CONFLICT");
    }

    const user = await User.create({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: hashPassword(parsed.data.password),
      role: parsed.data.role,
      isActive: parsed.data.isActive ?? true,
    });

    await writeAuditLog({
      action: "USER_CREATED",
      entityType: "User",
      entityId: String(user._id),
      user: admin,
      metadata: { email: user.email, role: user.role },
    });

    return apiSuccess(
      {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}