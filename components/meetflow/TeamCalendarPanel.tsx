"use client";

import { useMemo, useState } from "react";
import type { Meeting, Member } from "@/features/scheduling/types";
import { DAYS, HOURS, formatSlot, slot } from "@/features/scheduling/slot";
import type { NotificationItem } from "@/components/meetflow/Notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("zh-TW", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TeamCalendarPanel({
  members,
  meetings,
  changeLog,
  onOpenMeeting,
}: {
  members: Member[];
  meetings: Meeting[];
  changeLog: NotificationItem[];
  onOpenMeeting: (meetingId: string) => void;
}) {
  const [filterParticipantId, setFilterParticipantId] = useState<string>("all");

  const filteredMeetings = useMemo(() => {
    if (filterParticipantId === "all") return meetings;
    return meetings.filter((m) => m.participantIds.includes(filterParticipantId));
  }, [filterParticipantId, meetings]);

  const meetingsBySlot = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const m of filteredMeetings) {
      const arr = map.get(m.slot) ?? [];
      arr.push(m);
      map.set(m.slot, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => b.createdAt - a.createdAt);
    return map;
  }, [filteredMeetings]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">團隊行事曆</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          在單一平台查看所有會議安排與變動，減少遺漏與衝突
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">篩選成員</p>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={filterParticipantId}
            onChange={(e) => setFilterParticipantId(e.target.value)}
          >
            <option value="all">全部</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-muted-foreground">
          顯示 {filteredMeetings.length} 場會議
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">週視圖</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="w-16" />
                  {DAYS.map((d) => (
                    <th key={d} className="p-2 text-center font-medium text-sm">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((h) => (
                  <tr key={h}>
                    <td className="text-right pr-3 text-muted-foreground text-xs py-2 whitespace-nowrap">
                      {h}:00
                    </td>
                    {DAYS.map((_, d) => {
                      const s = slot(d, h);
                      const list = meetingsBySlot.get(s) ?? [];
                      const has = list.length > 0;
                      return (
                        <td key={d} className="align-top p-1">
                          <div
                            className={`min-h-12 rounded border p-2 ${
                              has
                                ? "bg-primary/5 border-primary/20"
                                : "bg-muted/40 border-border"
                            }`}
                          >
                            {has ? (
                              <div className="space-y-1.5">
                                {list.slice(0, 3).map((m) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    className="w-full flex items-start gap-2 text-left hover:bg-muted/30 rounded-md p-1 -m-1 transition-colors"
                                    onClick={() => onOpenMeeting(m.id)}
                                    title="點擊以編輯/改期"
                                  >
                                    <Badge variant="secondary" className="text-[10px] h-5">
                                      會議
                                    </Badge>
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium truncate">
                                        {m.title}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground">
                                        {m.participantIds.length} 人
                                      </p>
                                    </div>
                                  </button>
                                ))}
                                {list.length > 3 && (
                                  <p className="text-[11px] text-muted-foreground">
                                    另有 {list.length - 3} 場…
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-[11px] text-muted-foreground">
                                —
                              </p>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">變動紀錄</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {changeLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">目前沒有變動紀錄</p>
          ) : (
            <div className="space-y-2">
              {changeLog.slice(0, 12).map((n) => (
                <div
                  key={n.id}
                  className="rounded-lg border p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(n.createdAt)}
                    </p>
                  </div>
                  <Badge variant={n.variant ?? "outline"} className="text-xs shrink-0">
                    {n.message.includes("套用") ? "改期" : "更新"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {meetings.length > 0 && (
            <p className="text-xs text-muted-foreground pt-2">
              小提示：點「會議推薦」可建立/編輯會議；本頁會即時同步。
            </p>
          )}
        </CardContent>
      </Card>

      {filteredMeetings.length > 0 && (
        <div className="text-xs text-muted-foreground">
          目前篩選下的最早一場：{formatSlot(filteredMeetings[filteredMeetings.length - 1]!.slot)}
        </div>
      )}
    </div>
  );
}

