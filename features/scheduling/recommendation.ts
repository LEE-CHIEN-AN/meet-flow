import type { Meeting, Member, SlotSuggestion, TimeSlot } from "./types";
import { isMemberAvailable, isMemberBusy } from "./availability";

function hourPenalty(s: TimeSlot): number {
  // MVP: penalize late hours slightly to prefer earlier slots
  const hour = Number(s.split("-")[1]);
  if (Number.isNaN(hour)) return 0;
  return Math.max(0, hour - 14); // 15+ gets penalty
}

export function recommendSlots(args: {
  members: Member[];
  meetings: Meeting[];
  participantIds: string[];
  candidateSlots: TimeSlot[];
  limit: number;
}): SlotSuggestion[] {
  const { members, meetings, participantIds, candidateSlots, limit } = args;
  const participants = participantIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => Boolean(m));

  const scored: SlotSuggestion[] = candidateSlots.map((slot) => {
    const availableParticipantIds: string[] = [];
    const unavailableParticipantIds: string[] = [];
    const busyParticipantIds: string[] = [];

    for (const p of participants) {
      const res = isMemberAvailable(p, slot, meetings);
      if (res.available) availableParticipantIds.push(p.id);
      else {
        unavailableParticipantIds.push(p.id);
        if (isMemberBusy(p.id, slot, meetings)) busyParticipantIds.push(p.id);
      }
    }

    // Simple, explainable score:
    // - maximize attendance
    // - prefer earlier time
    // - heavily penalize busy conflicts vs just "not in availability"
    const attend = availableParticipantIds.length;
    const busyPenalty = busyParticipantIds.length * 6;
    const unavailablePenalty = (unavailableParticipantIds.length - busyParticipantIds.length) * 3;
    const timePenalty = hourPenalty(slot);
    const score = attend * 10 - busyPenalty - unavailablePenalty - timePenalty;

    return {
      slot,
      score,
      availableParticipantIds,
      unavailableParticipantIds,
      busyParticipantIds,
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, Math.max(1, limit));
}

