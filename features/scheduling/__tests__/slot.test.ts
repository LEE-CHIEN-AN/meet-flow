import { describe, expect, it } from "vitest";
import { formatSlot, parseSlot, slot } from "../slot";

describe("slot utils", () => {
  it("slot(day, hour) encodes to day-hour", () => {
    expect(slot(2, 9)).toBe("2-9");
  });

  it("parseSlot decodes day-hour", () => {
    expect(parseSlot("2-9")).toEqual({ day: 2, hour: 9 });
  });

  it("formatSlot renders human readable label", () => {
    expect(formatSlot("2-9")).toBe("週三 9:00–10:00");
  });
});

