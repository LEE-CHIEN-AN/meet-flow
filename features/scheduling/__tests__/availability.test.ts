import { describe, expect, it } from "vitest";
import type { Meeting, Member } from "../types";
import { isMemberAvailable, commonSlots } from "../availability";

const memberA: Member = {
  id: "a",
  name: "A",
  color: "bg-blue-500",
  availability: ["0-9", "0-10"],
};

const memberB: Member = {
  id: "b",
  name: "B",
  color: "bg-green-500",
  availability: ["0-9"],
};

describe("availability", () => {
  it("returns unavailable when slot not in availability", () => {
    expect(isMemberAvailable(memberA, "0-11", [])).toEqual({
      available: false,
      reason: "unavailable",
    });
  });

  it("returns busy when member has meeting on that slot", () => {
    const meetings: Meeting[] = [
      {
        id: "m1",
        title: "Sync",
        slot: "0-9",
        durationHours: 1,
        participantIds: ["a"],
        priority: "normal",
        createdAt: 0,
      },
    ];
    expect(isMemberAvailable(memberA, "0-9", meetings)).toEqual({
      available: false,
      reason: "busy",
    });
  });

  it("computes common slots across members (respecting meetings)", () => {
    const universe = ["0-9", "0-10"];
    const meetings: Meeting[] = [
      {
        id: "m1",
        title: "Blocks B",
        slot: "0-9",
        durationHours: 1,
        participantIds: ["b"],
        priority: "normal",
        createdAt: 0,
      },
    ];
    expect(commonSlots([memberA, memberB], meetings, universe)).toEqual([]);
  });
});

