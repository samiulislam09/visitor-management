import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import mongoose from "mongoose";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "development-secret-change-me";
const secret = new TextEncoder().encode(AUTH_SECRET);

export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "RECEPTIONIST" | "SECURITY";
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ role: user.role, name: user.name, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

interface DecodedSession {
  sub: string;
  role: SessionUser["role"];
  name: string;
  email: string;
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const decoded = payload as unknown as DecodedSession;
    if (!decoded.sub || !decoded.role) return null;
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  await dbConnect();
  const user = await User.findById(session.id).select("+passwordHash").lean().exec();
  if (!user || !user.isActive) return null;
  const { _id, email, name, role } = user;
  return {
    id: String(_id),
    email: String(email ?? ""),
    name: String(name ?? ""),
    role: role as SessionUser["role"],
  };
}

export function isMongoId(value: string): boolean {
  return mongoose.isValidObjectId(value);
}