import type { Meeting, Member, TimeSlot } from "./types";

export function meetingBlocksSlot(
  meeting: Meeting,
  participantId: string,
  s: TimeSlot
): boolean {
  if (!meeting.participantIds.includes(participantId)) return false;
  // MVP: durationHours=1 only; keep API ready for extension
  return meeting.slot === s;
}

export function isMemberBusy(
  memberId: string,
  s: TimeSlot,
  meetings: Meeting[]
): boolean {
  return meetings.some((m) => meetingBlocksSlot(m, memberId, s));
}

export function isMemberAvailable(
  member: Member,
  s: TimeSlot,
  meetings: Meeting[]
): { available: boolean; reason?: "unavailable" | "busy" } {
  if (!member.availability.includes(s)) return { available: false, reason: "unavailable" };
  if (isMemberBusy(member.id, s, meetings)) return { available: false, reason: "busy" };
  return { available: true };
}

export function commonSlots(
  members: Member[],
  meetings: Meeting[],
  universe: TimeSlot[]
): TimeSlot[] {
  return universe.filter((s) =>
    members.every((m) => isMemberAvailable(m, s, meetings).available)
  );
}

