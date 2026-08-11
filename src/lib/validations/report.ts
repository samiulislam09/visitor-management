import { z } from "zod";
import { VISITOR_STATUSES } from "@/lib/constants";

export const reportFilterSchema = z.object({
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  hostId: z.string().optional(),
  department: z.string().trim().optional(),
  purpose: z.string().trim().optional(),
  status: z.enum(VISITOR_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sort: z.string().trim().optional(),
});

export type ReportFilterInput = z.infer<typeof reportFilterSchema>;

export const reportExportSchema = reportFilterSchema.omit({ page: true, pageSize: true });

export type ReportExportInput = z.infer<typeof reportExportSchema>;

export const dashboardRangeSchema = z.enum(["today", "7d", "30d"]).default("7d");