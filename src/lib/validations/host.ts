import { z } from "zod";
import { HOST_STATUSES } from "@/lib/constants";
import { phoneRegex } from "./visitor";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === undefined || v === "" ? undefined : v))
  .refine((v) => v === undefined || v.length <= 500, {
    message: "Must be 500 characters or fewer",
  });

export const hostSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(200),
  email: optionalString.pipe(
    z
      .string()
      .email("Enter a valid email address")
      .max(200)
      .optional()
      .or(z.literal("").optional())
      .transform((v) => (v === "" ? undefined : v))
  ),
  phone: optionalString.pipe(
    z
      .string()
      .regex(phoneRegex, "Enter a valid phone number")
      .optional()
      .or(z.literal("").optional())
      .transform((v) => (v === "" ? undefined : v))
  ),
  department: optionalString,
  designation: optionalString,
  employeeId: z.string().trim().min(1, "Employee ID is required").max(100),
  status: z.enum(HOST_STATUSES).default("ACTIVE").optional(),
});

export type HostInput = z.infer<typeof hostSchema>;

export const hostUpdateSchema = hostSchema.partial();

export type HostUpdateInput = z.infer<typeof hostUpdateSchema>;