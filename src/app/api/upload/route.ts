import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireApiAuth } from "@/lib/api-auth";
import { apiSuccess, handleApiError, apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

interface Metadata {
  image: string;
}

export async function POST(request: NextRequest) {
  try {
    await requireApiAuth("visitor:create");

    const metadata: Metadata | unknown = await request.json().catch(() => null);
    const image = (metadata as Metadata | null)?.image;
    if (!image || typeof image !== "string") {
      return apiError("No image provided", 400, "BAD_REQUEST");
    }

    const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(image);
    if (!match) {
      return apiError("Unsupported image format", 400, "BAD_REQUEST");
    }

    const mimeType = match[1] as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    const base64 = match[2] as string;
    const buffer = Buffer.from(base64, "base64");

    if (buffer.length > MAX_IMAGE_BYTES) {
      return apiError("Image is too large (max 3MB)", 400, "BAD_REQUEST");
    }

    const extension = mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1];
    const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${extension}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer);

    return apiSuccess({ url: `/uploads/${filename}` }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}