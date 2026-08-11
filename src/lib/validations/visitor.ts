import { z } from "zod";
import { ID_TYPES, VISIT_PURPOSES } from "@/lib/constants";

export const phoneRegex = /^\+?[0-9][0-9\s().-]{6,19}$/;

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === undefined || v === "" ? undefined : v))
  .refine((v) => v === undefined || v.length <= 500, {
    message: "Must be 500 characters or fewer",
  });

const timeRegex =
  /^(\d{1,2}):(\d{2})\s?(AM|PM|am|pm)$|^([01]?\d|2[0-3]):[0-5]\d$/;

const visitorFieldDefs = {
  fullName: z
    .string()
    .trim()
    .min(2, "Full name is required")
    .max(200, "Full name is too long"),
  phone: z.string().trim().regex(phoneRegex, "Enter a valid phone number"),
  email: optionalString.pipe(
    z
      .string()
      .email("Enter a valid email address")
      .max(200)
      .optional()
      .or(z.literal("").optional())
      .transform((v) => (v === "" ? undefined : v))
  ),
  address: optionalString,
  company: optionalString,
  photoUrl: optionalString,
  idType: z.enum(ID_TYPES).optional(),
  idNumber: optionalString,
  purpose: z.enum(VISIT_PURPOSES, { message: "Select a visit purpose" }),
  customPurpose: optionalString,
  hostId: z.string().min(1, "Host is required"),
  department: optionalString,
  expectedDate: z.string().optional(),
  expectedTime: z.string().regex(timeRegex, "Enter a valid time").optional().or(z.literal("").optional()),
  expectedDuration: z.number().int().positive().max(720).optional(),
  numberOfVisitors: z.number().int().min(1).max(1000).optional(),
  vehicleNumber: optionalString,
  notes: optionalString,
  checkInStatus: z.enum(["CHECK_IN", "EXPECTED"]).optional(),
} satisfies z.ZodRawShape;

const visitorRefinement = (data: {
  purpose?: string;
  customPurpose?: string;
  idType?: string;
  idNumber?: string;
}, ctx: z.RefinementCtx) => {
  if (data.purpose === "Other" && !data.customPurpose) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customPurpose"],
      message: "Please describe the custom purpose",
    });
  }
  if (data.idType && !data.idNumber) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["idNumber"],
      message: "ID number is required when an ID type is selected",
    });
  }
};

export const visitorSchema = z.object(visitorFieldDefs).superRefine(visitorRefinement);

export type VisitorInput = z.infer<typeof visitorSchema>;

export const visitorUpdateSchema = z.object(visitorFieldDefs).partial().superRefine(visitorRefinement);

export type VisitorUpdateInput = z.infer<typeof visitorUpdateSchema>;

export const checkInSchema = z.object({
  checkInTime: z.string().datetime().optional(),
});

export const checkOutSchema = z.object({
  checkOutTime: z.string().datetime().optional(),
});

export const idParamSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");