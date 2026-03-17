import type {
  Meeting,
  MeetingPriority,
  MeetingType,
  Member,
  SlotSuggestion,
  TimeSlot,
} from "./types";
import { isMemberAvailable, isMemberBusy } from "./availability";

function hourPenalty(s: TimeSlot, args: { meetingType?: MeetingType }): number {
  // Penalize late hours; meeting type can adjust strictness.
  const hour = Number(s.split("-")[1]);
  if (Number.isNaN(hour)) return 0;
  const lateStart =
    args.meetingType === "decision"
      ? 13
      : args.meetingType === "discussion"
        ? 15
        : 14;
  return Math.max(0, hour - lateStart); // meeting-type-dependent
}

function priorityWeights(priority: MeetingPriority | undefined): {
  attendW: number;
  busyW: number;
  unavailW: number;
} {
  switch (priority) {
    case "high":
      return { attendW: 14, busyW: 9, unavailW: 4 };
    case "low":
      return { attendW: 7, busyW: 4, unavailW: 2 };
    case "normal":
    default:
      return { attendW: 10, busyW: 6, unavailW: 3 };
  }
}

export function recommendSlots(args: {
  members: Member[];
  meetings: Meeting[];
  participantIds: string[];
  candidateSlots: TimeSlot[];
  limit: number;
  meetingType?: MeetingType;
  meetingPriority?: MeetingPriority;
}): SlotSuggestion[] {
  const {
    members,
    meetings,
    participantIds,
    candidateSlots,
    limit,
    meetingType,
    meetingPriority,
  } = args;
  const participants = participantIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => Boolean(m));

  const w = priorityWeights(meetingPriority);

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
    const busyPenalty = busyParticipantIds.length * w.busyW;
    const unavailablePenalty =
      (unavailableParticipantIds.length - busyParticipantIds.length) * w.unavailW;
    const timePenalty = hourPenalty(slot, { meetingType });
    const score = attend * w.attendW - busyPenalty - unavailablePenalty - timePenalty;

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

