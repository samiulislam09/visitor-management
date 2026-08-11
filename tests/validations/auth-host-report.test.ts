import { describe, expect, it } from "vitest";
import { loginSchema, createUserSchema } from "@/lib/validations/auth";
import { hostSchema, hostUpdateSchema } from "@/lib/validations/host";
import { reportFilterSchema } from "@/lib/validations/report";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.parse({ email: "admin@company.com", password: "secret" })).toMatchObject({
      email: "admin@company.com",
    });
  });

  it("rejects a malformed email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("createUserSchema", () => {
  const user = {
    email: "op@company.com",
    name: "Operator",
    password: "password123",
    role: "RECEPTIONIST",
  };

  it("accepts a valid user", () => {
    expect(createUserSchema.parse(user).role).toBe("RECEPTIONIST");
  });

  it("rejects a short password", () => {
    expect(createUserSchema.safeParse({ ...user, password: "short" }).success).toBe(false);
  });

  it("rejects an invalid role", () => {
    expect(createUserSchema.safeParse({ ...user, role: "SUPERUSER" }).success).toBe(false);
  });
});

describe("hostSchema", () => {
  const host = {
    name: "Alice",
    employeeId: "EMP-001",
    phone: "+8801712345678",
  };

  it("accepts a valid host", () => {
    expect(hostSchema.parse(host).name).toBe("Alice");
  });

  it("rejects a blank employee ID", () => {
    expect(hostSchema.safeParse({ ...host, employeeId: "" }).success).toBe(false);
  });

  it("accepts an optional email", () => {
    expect(hostSchema.parse({ ...host, email: "alice@company.com" }).email).toBe(
      "alice@company.com"
    );
  });
});

describe("hostUpdateSchema", () => {
  it("accepts a partial update with status", () => {
    const result = hostUpdateSchema.parse({ status: "INACTIVE" });
    expect(result.status).toBe("INACTIVE");
  });
});

describe("reportFilterSchema", () => {
  it("parses string pages into numbers", () => {
    const result = reportFilterSchema.parse({ page: "3", pageSize: "50" });
    expect(result.page).toBe(3);
  });

  it("rejects an invalid status", () => {
    expect(reportFilterSchema.safeParse({ status: "NOT_A_STATUS" }).success).toBe(false);
  });
});