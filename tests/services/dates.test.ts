import { describe, expect, it } from "vitest";
import { startOfDay, endOfDay, toDateKey } from "@/lib/services/dashboard";
import {
  formatDuration,
  getInitials,
  toTitleCase,
  parsePositiveInt,
  relativeTime,
} from "@/lib/utils";

describe("date helpers", () => {
  it("startOfDay resets the time", () => {
    const d = new Date(2024, 0, 5, 15, 30, 45);
    expect(startOfDay(d).getHours()).toBe(0);
    expect(startOfDay(d).getDate()).toBe(5);
  });

  it("endOfDay is the last millisecond", () => {
    const d = new Date(2024, 0, 5);
    const e = endOfDay(d);
    expect(e.getHours()).toBe(23);
    expect(e.getMinutes()).toBe(59);
    expect(e.getSeconds()).toBe(59);
  });

  it("toDateKey formats YYYY-MM-DD", () => {
    expect(toDateKey(new Date(2024, 0, 5))).toBe("2024-01-05");
  });
});

describe("formatDuration", () => {
  it("formats an elapsed duration", () => {
    const start = new Date("2024-01-05T09:00:00");
    const end = new Date("2024-01-05T09:45:00");
    expect(formatDuration(start, end)).toBe("45m");
  });

  it("pads over an hour", () => {
    const start = new Date("2024-01-05T09:00:00");
    const end = new Date("2024-01-05T11:15:00");
    expect(formatDuration(start, end)).toBe("2h 15m");
  });
});

describe("text helpers", () => {
  it("gets initials from a name", () => {
    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("Jane")).toBe("J");
  });

  it("title cases snake/camel words", () => {
    expect(toTitleCase("CHECKED_IN")).toBe("Checked In");
  });
});

describe("parsePositiveInt", () => {
  it("parses positive integers", () => {
    expect(parsePositiveInt("42", 1)).toBe(42);
    expect(parsePositiveInt("0", 1)).toBe(1);
  });

  it("returns fallback for invalid input", () => {
    expect(parsePositiveInt("abc", 1)).toBe(1);
    expect(parsePositiveInt("-3", 1)).toBe(1);
    expect(parsePositiveInt(null, 1)).toBe(1);
  });
});

describe("relativeTime", () => {
  it("returns just now for fresh timestamps", () => {
    expect(relativeTime(new Date())).toBe("just now");
  });

  it("formats minutes ago", () => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    expect(relativeTime(d)).toBe("5m ago");
  });
});