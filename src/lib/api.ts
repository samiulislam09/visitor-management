import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INVALID_ID"
  | "INTERNAL_ERROR"
  | "METHOD_NOT_ALLOWED"
  | "RATE_LIMITED";

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  details?: unknown;

  constructor(message: string, status = 500, code: ApiErrorCode = "INTERNAL_ERROR", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
  message: string,
  status = 500,
  code: ApiErrorCode = "INTERNAL_ERROR",
  details?: unknown
) {
  return NextResponse.json(
    { success: false, error: { message, code, ...(details ? { details } : {}) } },
    { status }
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return apiError(error.message, error.status, error.code, error.details);
  }
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return apiError("Validation failed", 422, "VALIDATION_ERROR", details);
  }
  if (error instanceof Error) {
    if (error.name === "MongoServerError") {
      const serverError = error as {
        code?: number;
        keyPattern?: Record<string, unknown>;
      };
      if (serverError.code === 11000) {
        const field = serverError.keyPattern
          ? Object.keys(serverError.keyPattern)[0]
          : "field";
        return apiError(
          `A record with this ${field ?? "value"} already exists`,
          409,
          "CONFLICT"
        );
      }
    }
    if (error.name === "CastError") {
      return apiError("Invalid record ID", 400, "INVALID_ID");
    }
  }
  console.error("[api]", error);
  return apiError("Something went wrong", 500, "INTERNAL_ERROR");
}