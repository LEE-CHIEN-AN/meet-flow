import type { Conflict, Meeting, Member, TimeSlot } from "./types";
import { isMemberAvailable } from "./availability";

export function detectConflicts(args: {
  members: Member[];
  meetings: Meeting[];
  participantIds: string[];
  slot: TimeSlot;
}): Conflict[] {
  const { members, meetings, participantIds, slot } = args;
  const conflicts: Conflict[] = [];

  for (const id of participantIds) {
    const member = members.find((m) => m.id === id);
    if (!member) continue;
    const res = isMemberAvailable(member, slot, meetings);
    if (!res.available) conflicts.push({ participantId: id, slot, reason: res.reason! });
  }

  return conflicts;
}

