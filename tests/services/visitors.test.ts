import { describe, expect, it } from "vitest";
import { formatVisitorId, toHostInfo, mapListRow } from "@/lib/services/visitors";

describe("formatVisitorId", () => {
  it("formats with date part and padded sequence", () => {
    const date = new Date(2024, 0, 5);
    expect(formatVisitorId(1, date)).toBe("VIS-20240105-00001");
  });

  it("pads sequence to five digits", () => {
    const date = new Date(2024, 11, 31);
    expect(formatVisitorId(99999, date)).toBe("VIS-20241231-99999");
  });
});

describe("toHostInfo", () => {
  it("maps a host doc", () => {
    const host = {
      _id: { toString: () => "64b8f1a2e8f1a2b3c4d5e6f7" },
      name: "Alice Chen",
      department: "Engineering",
      designation: "Manager",
    };
    expect(toHostInfo(host)).toEqual({
      id: "64b8f1a2e8f1a2b3c4d5e6f7",
      name: "Alice Chen",
      department: "Engineering",
      designation: "Manager",
    });
  });

  it("handles an undefined host", () => {
    expect(toHostInfo(undefined)).toBeUndefined();
  });

  it("falls back to Unknown name", () => {
    expect(toHostInfo({ id: "x" })?.name).toBe("Unknown");
  });
});

describe("mapListRow", () => {
  it("maps an aggregate row", () => {
    const row = mapListRow({
      _id: "64b8f1a2e8f1a2b3c4d5e6f7",
      visitorId: "VIS-20240105-00001",
      fullName: "John Doe",
      phone: "+8801712345678",
      purpose: "Meeting",
      status: "CHECKED_IN",
      host: { _id: "h1", name: "Alice", department: "Eng" },
      createdAt: "2024-01-05T09:00:00Z",
      checkInTime: "2024-01-05T09:05:00Z",
    });
    expect(row.id).toBe("64b8f1a2e8f1a2b3c4d5e6f7");
    expect(row.status).toBe("CHECKED_IN");
    expect(row.host?.name).toBe("Alice");
    expect(row.createdAt).toBe("2024-01-05T09:00:00.000Z");
  });

  it("defaults missing host to undefined", () => {
    const row = mapListRow({
      _id: "a",
      visitorId: "V",
      fullName: "Jane",
      phone: "123",
      purpose: "Interview",
      status: "EXPECTED",
      createdAt: "2024-01-05T09:00:00Z",
    });
    expect(row.host).toBeUndefined();
  });
});