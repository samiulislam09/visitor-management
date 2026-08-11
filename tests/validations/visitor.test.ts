import { describe, expect, it } from "vitest";
import { visitorSchema, visitorUpdateSchema } from "@/lib/validations/visitor";

const base = {
  fullName: "John Doe",
  phone: "+8801712345678",
  purpose: "Meeting",
  hostId: "64b8f1a2e8f1a2b3c4d5e6f7",
  email: "",
  address: "",
  company: "Acme",
  expectedTime: "",
  checkInStatus: "EXPECTED",
};

describe("visitorSchema", () => {
  it("accepts a valid visitor", () => {
    const result = visitorSchema.parse(base);
    expect(result.fullName).toBe("John Doe");
    expect(result.email).toBeUndefined();
  });

  it("rejects a missing full name", () => {
    const result = visitorSchema.safeParse({ ...base, fullName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid phone number", () => {
    const result = visitorSchema.safeParse({ ...base, phone: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = visitorSchema.safeParse({ ...base, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a host selection of Other without a custom purpose", () => {
    const result = visitorSchema.safeParse({ ...base, purpose: "Other" });
    expect(result.success).toBe(false);
  });

  it("accepts Other when a custom purpose is provided", () => {
    const result = visitorSchema.safeParse({ ...base, purpose: "Other", customPurpose: "Technical audit" });
    expect(result.success).toBe(true);
  });

  it("requires an ID number when an ID type is selected", () => {
    const result = visitorSchema.safeParse({ ...base, idType: "Passport" });
    expect(result.success).toBe(false);
  });

  it("accepts an ID number with an ID type", () => {
    const result = visitorSchema.safeParse({ ...base, idType: "Passport", idNumber: "P0123456" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid expected time", () => {
    const result = visitorSchema.safeParse({ ...base, expectedTime: "25:99" });
    expect(result.success).toBe(false);
  });

  it("accepts a 12-hour expected time", () => {
    const result = visitorSchema.safeParse({ ...base, expectedTime: "02:30 PM" });
    expect(result.success).toBe(true);
  });
});

describe("visitorUpdateSchema (partial)", () => {
  it("accepts a partial update", () => {
    const result = visitorUpdateSchema.parse({ fullName: "Jane Doe" });
    expect(result.fullName).toBe("Jane Doe");
  });

  it("accepts an empty object", () => {
    const result = visitorUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("still validates refinement rules", () => {
    const result = visitorUpdateSchema.safeParse({ purpose: "Other" });
    expect(result.success).toBe(false);
  });
});