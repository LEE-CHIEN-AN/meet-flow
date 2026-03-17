import type { MeetingPriority, MeetingType } from "./types";

export function suggestPriority(meetingType: MeetingType): MeetingPriority {
  switch (meetingType) {
    case "decision":
      return "high";
    case "sync":
      return "normal";
    case "discussion":
      return "low";
  }
}

export function meetingTypeLabel(meetingType: MeetingType): string {
  switch (meetingType) {
    case "decision":
      return "決策型";
    case "sync":
      return "同步型";
    case "discussion":
      return "討論型";
  }
}

export function priorityLabel(priority: MeetingPriority): string {
  switch (priority) {
    case "high":
      return "高";
    case "normal":
      return "中";
    case "low":
      return "低";
  }
}

