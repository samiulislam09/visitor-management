import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api";
import { exportReports } from "@/lib/services/reports";
import { reportFilterSchema } from "@/lib/validations/report";
import { formatDateTime, formatTime, formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  if (/[\s",]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function escapeBom(text: string): Uint8Array {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  const result = new Uint8Array(bytes.length + 3);
  result[0] = 0xef;
  result[1] = 0xbb;
  result[2] = 0xbf;
  result.set(bytes, 3);
  return result;
}

export async function GET(request: NextRequest) {
  try {
    await requireApiAuth("report:export");
    const { searchParams } = new URL(request.url);

    const raw = {
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      hostId: searchParams.get("hostId") ?? undefined,
      department: searchParams.get("department") ?? undefined,
      purpose: searchParams.get("purpose") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    };

    const parsed = reportFilterSchema.partial().safeParse(raw);
    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    const rows = await exportReports(parsed.data);

    const header = [
      "Date",
      "Visitor",
      "Phone",
      "Company",
      "Host",
      "Department",
      "Purpose",
      "Check-in",
      "Check-out",
      "Duration",
      "Status",
      "Visitor ID",
    ];

    const lines = [
      header.map(csvCell).join(","),
      ...rows.map((row) =>
        [
          formatDateTime(row.createdAt),
          row.fullName,
          row.phone,
          row.company ?? "",
          row.host?.name ?? "",
          row.department ?? "",
          row.customPurpose || row.purpose,
          row.checkInTime ? formatTime(row.checkInTime) : "",
          row.checkOutTime ? formatTime(row.checkOutTime) : "",
          row.checkInTime ? formatDuration(row.checkInTime, row.checkOutTime) : "",
          row.status,
          row.visitorId,
        ]
          .map(csvCell)
          .join(",")
      ),
    ].join("\n");

    const filename = `visitor-report-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(escapeBom(lines) as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return handleApiError(error);
  }
}