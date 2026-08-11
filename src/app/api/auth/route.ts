import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/password";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import {
  signSession,
  verifySessionToken,
  SESSION_DURATION_MS,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { handleApiError, apiError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit-log";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION_MS / 1000,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid login credentials", 422, "VALIDATION_ERROR");
    }

    await dbConnect();
    const user = await User.findOne({ email: parsed.data.email }).exec();
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return apiError("Invalid email or password", 401, "UNAUTHORIZED");
    }

    if (!user.isActive) {
      return apiError("This account has been deactivated", 403, "FORBIDDEN");
    }

    const sessionUser = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
    };
    const token = await signSession(sessionUser);

    await writeAuditLog({
      action: "LOGIN",
      entityType: "User",
      entityId: sessionUser.id,
      user: sessionUser,
      metadata: { email: sessionUser.email },
    });

    const response = NextResponse.json({ success: true, data: { user: sessionUser } });
    response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? await verifySessionToken(token) : null;
    return NextResponse.json({
      success: true,
      data: user ? { user } : { user: null },
    });
  } catch {
    return NextResponse.json({ success: true, data: { user: null } });
  }
}