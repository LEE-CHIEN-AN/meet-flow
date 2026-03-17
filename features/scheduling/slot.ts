import type { TimeSlot } from "./types";

export const DAYS = ["週一", "週二", "週三", "週四", "週五"] as const;
export const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17] as const;

export function slot(day: number, hour: number): TimeSlot {
  return `${day}-${hour}`;
}

export function parseSlot(s: TimeSlot): { day: number; hour: number } {
  const [dayStr, hourStr] = s.split("-");
  return { day: Number(dayStr), hour: Number(hourStr) };
}

export function formatSlot(s: TimeSlot): string {
  const { day, hour } = parseSlot(s);
  const dayLabel = DAYS[day] ?? `Day${day}`;
  return `${dayLabel} ${hour}:00–${hour + 1}:00`;
}

