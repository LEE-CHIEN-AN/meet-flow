"use client";

import { useMemo, useState } from "react";
import type { Meeting, Member, TimeSlot } from "@/features/scheduling/types";
import { DAYS, HOURS, parseSlot, slot } from "@/features/scheduling/slot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function consecutiveMax(hours: number[]): number {
  const sorted = [...hours].sort((a, b) => a - b);
  let best = 0;
  let cur = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || sorted[i] === sorted[i - 1]! + 1) cur += 1;
    else cur = 1;
    best = Math.max(best, cur);
  }
  return best;
}

function focusBlocks(args: {
  available: TimeSlot[];
  busy: TimeSlot[];
  minHours: number;
}): { day: number; startHour: number; length: number }[] {
  const { available, busy, minHours } = args;
  const set = new Set(available.filter((s) => !busy.includes(s)));
  const blocks: { day: number; startHour: number; length: number }[] = [];
  for (let d = 0; d < DAYS.length; d++) {
    let curStart: number | null = null;
    let curLen = 0;
    for (const h of HOURS) {
      const ok = set.has(slot(d, h));
      if (ok) {
        if (curStart === null) curStart = h;
        curLen += 1;
      } else {
        if (curStart !== null && curLen >= minHours) {
          blocks.push({ day: d, startHour: curStart, length: curLen });
        }
        curStart = null;
        curLen = 0;
      }
    }
    if (curStart !== null && curLen >= minHours) {
      blocks.push({ day: d, startHour: curStart, length: curLen });
    }
  }
  return blocks;
}

export function WorkloadPanel({
  members,
  meetings,
}: {
  members: Member[];
  meetings: Meeting[];
}) {
  const [memberId, setMemberId] = useState<string>(members.find((m) => m.id === "me")?.id ?? members[0]?.id ?? "");
  const member = members.find((m) => m.id === memberId) ?? members[0];

  const myMeetings = useMemo(
    () => meetings.filter((m) => m.participantIds.includes(memberId)),
    [meetings, memberId]
  );

  const meetingSlots = useMemo(() => myMeetings.map((m) => m.slot), [myMeetings]);
  const busySlots = useMemo(
    () => uniq([...(member?.externalBusy ?? []), ...meetingSlots]),
    [member?.externalBusy, meetingSlots]
  );

  const meetingsByDay = useMemo(() => {
    const byDay = new Map<number, Meeting[]>();
    for (const m of myMeetings) {
      const { day } = parseSlot(m.slot);
      const arr = byDay.get(day) ?? [];
      arr.push(m);
      byDay.set(day, arr);
    }
    for (const arr of byDay.values()) arr.sort((a, b) => parseSlot(a.slot).hour - parseSlot(b.slot).hour);
    return byDay;
  }, [myMeetings]);

  const summary = useMemo(() => {
    const hoursByDay = new Map<number, number[]>();
    for (const s of meetingSlots) {
      const { day, hour } = parseSlot(s);
      const arr = hoursByDay.get(day) ?? [];
      arr.push(hour);
      hoursByDay.set(day, arr);
    }
    const perDay = DAYS.map((_, d) => ({
      day: d,
      count: hoursByDay.get(d)?.length ?? 0,
      streak: consecutiveMax(hoursByDay.get(d) ?? []),
    }));
    const total = meetingSlots.length;
    const maxDay = perDay.reduce((a, b) => (b.count > a.count ? b : a), perDay[0]!);
    const maxStreak = perDay.reduce((a, b) => (b.streak > a.streak ? b : a), perDay[0]!);
    return { total, perDay, maxDay, maxStreak };
  }, [meetingSlots]);

  const focus = useMemo(() => {
    if (!member) return [];
    return focusBlocks({
      available: member.availability,
      busy: busySlots,
      minHours: 2,
    });
  }, [busySlots, member]);

  if (!member) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">個人會議負載與壓力指標</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          依不同時間區段檢視會議密度與連續會議，協助保留專注工作時間
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {members.map((m) => (
          <Button
            key={m.id}
            size="sm"
            variant={m.id === memberId ? "default" : "outline"}
            onClick={() => setMemberId(m.id)}
          >
            {m.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">本週會議總量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-semibold">{summary.total}</p>
              <Badge variant="secondary" className="text-xs">
                小時（以 1h slot 計）
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              外部忙碌：{member.externalBusy?.length ?? 0} 格 · 會議：{myMeetings.length} 格
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">最高密度</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {DAYS[summary.maxDay.day]}：{summary.maxDay.count} 場
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              密度越高越容易產生切換成本與延誤
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">最長連續會議</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {DAYS[summary.maxStreak.day]}：連續 {summary.maxStreak.streak} 小時
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              連續會議越長，壓力/疲勞風險越高
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">每日概覽</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {summary.perDay.map((d) => (
            <div key={d.day} className="flex items-center justify-between gap-3">
              <p className="text-sm w-14">{DAYS[d.day]}</p>
              <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                <div
                  className="h-2 bg-primary"
                  style={{ width: `${Math.min(100, (d.count / 6) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground w-28 text-right">
                {d.count} 場 · 連續 {d.streak}h
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">建議保留專注時段</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {focus.length === 0 ? (
            <p className="text-sm text-muted-foreground">目前找不到連續 2 小時以上的專注區塊</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {focus.slice(0, 10).map((b, idx) => (
                <Badge key={`${b.day}-${b.startHour}-${idx}`} variant="outline" className="text-xs">
                  {DAYS[b.day]} {b.startHour}:00 起 · {b.length}h
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground pt-2">
            指標以「會議 slot + 外部忙碌」推估，屬於 demo 級的壓力 proxy。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

