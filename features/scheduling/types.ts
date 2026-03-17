export type TimeSlot = string; // "day-hour", e.g. "0-9" = Monday 9am

export type Member = {
  id: string;
  name: string;
  color: string;
  availability: TimeSlot[];
};

export type MeetingPriority = "low" | "normal" | "high";

export type MeetingType = "decision" | "sync" | "discussion";

export type Meeting = {
  id: string;
  title: string;
  slot: TimeSlot;
  durationHours: number;
  participantIds: string[];
  meetingType: MeetingType;
  priority: MeetingPriority;
  createdAt: number;
};

export type Conflict = {
  participantId: string;
  slot: TimeSlot;
  reason: "unavailable" | "busy";
};

export type SlotSuggestion = {
  slot: TimeSlot;
  score: number;
  availableParticipantIds: string[];
  unavailableParticipantIds: string[];
  busyParticipantIds: string[];
};

