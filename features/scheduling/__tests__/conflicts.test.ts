import { describe, expect, it } from "vitest";
import type { Meeting, Member } from "../types";
import { detectConflicts } from "../conflicts";

const members: Member[] = [
  { id: "a", name: "A", color: "x", availability: ["0-9"] },
  { id: "b", name: "B", color: "y", availability: ["0-9"] },
];

describe("conflicts", () => {
  it("detects unavailable and busy conflicts", () => {
    const meetings: Meeting[] = [
      {
        id: "m1",
        title: "Busy A",
        slot: "0-9",
        durationHours: 1,
        participantIds: ["a"],
        meetingType: "sync",
        priority: "normal",
        createdAt: 0,
      },
    ];

    const res = detectConflicts({
      members,
      meetings,
      participantIds: ["a", "b"],
      slot: "0-9",
    });

    expect(res).toEqual([{ participantId: "a", slot: "0-9", reason: "busy" }]);
  });

  it("detects unavailable when not in availability", () => {
    const res = detectConflicts({
      members,
      meetings: [],
      participantIds: ["a"],
      slot: "0-10",
    });

    expect(res).toEqual([{ participantId: "a", slot: "0-10", reason: "unavailable" }]);
  });
});

