import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  name: z.string().trim().min(2, "Name is required").max(200),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "RECEPTIONIST", "SECURITY"]),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;