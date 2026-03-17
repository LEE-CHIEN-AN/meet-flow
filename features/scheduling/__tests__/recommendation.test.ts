import { describe, expect, it } from "vitest";
import type { Meeting, Member } from "../types";
import { recommendSlots } from "../recommendation";

const members: Member[] = [
  { id: "a", name: "A", color: "x", availability: ["0-9", "0-10"] },
  { id: "b", name: "B", color: "y", availability: ["0-9"] },
  { id: "c", name: "C", color: "z", availability: ["0-10"] },
];

describe("recommendation", () => {
  it("prefers higher attendance slots", () => {
    const meetings: Meeting[] = [];
    const res = recommendSlots({
      members,
      meetings,
      participantIds: ["a", "b", "c"],
      candidateSlots: ["0-9", "0-10"],
      limit: 2,
    });

    // 0-9: a+b available (2); c unavailable (1)
    // 0-10: a+c available (2); b unavailable (1)
    // Attendance ties; earlier/later penalty may affect ordering, but both must appear.
    expect(res.map((r) => r.slot).sort()).toEqual(["0-10", "0-9"]);
  });

  it("penalizes busy conflicts more than plain unavailability", () => {
    const meetings: Meeting[] = [
      {
        id: "m1",
        title: "Busy A at 0-9",
        slot: "0-9",
        durationHours: 1,
        participantIds: ["a"],
        priority: "normal",
        createdAt: 0,
      },
    ];

    const res = recommendSlots({
      members,
      meetings,
      participantIds: ["a", "b"],
      candidateSlots: ["0-9", "0-10"],
      limit: 1,
    });

    // 0-9 would be busy for a; 0-10 b is unavailable but a is available.
    expect(res[0]!.slot).toBe("0-10");
    expect(res[0]!.unavailableParticipantIds).toContain("b");
  });
});

