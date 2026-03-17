"use client";

import { useMemo, useState } from "react";
import type { Meeting, Member, TimeSlot } from "@/features/scheduling/types";
import { DAYS, HOURS, formatSlot, slot } from "@/features/scheduling/slot";
import { detectConflicts } from "@/features/scheduling/conflicts";
import { recommendSlots } from "@/features/scheduling/recommendation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function MeetingPlannerPanel({
  members,
  meetings,
  onCreateMeeting,
}: {
  members: Member[];
  meetings: Meeting[];
  onCreateMeeting: (meeting: Meeting) => void;
}) {
  const [meetingTitle, setMeetingTitle] = useState("週會");
  const [meetingSlot, setMeetingSlot] = useState<TimeSlot>(slot(2, 9));
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(
    ["me", "xiao-liang", "lu-lu"]
  );

  const candidateSlots: TimeSlot[] = useMemo(
    () => DAYS.flatMap((_, d) => HOURS.map((h) => slot(d, h))),
    []
  );

  const meetingConflicts = useMemo(
    () =>
      detectConflicts({
        members,
        meetings,
        participantIds: selectedParticipantIds,
        slot: meetingSlot,
      }),
    [members, meetings, meetingSlot, selectedParticipantIds]
  );

  const recommendations = useMemo(
    () =>
      recommendSlots({
        members,
        meetings,
        participantIds: selectedParticipantIds,
        candidateSlots,
        limit: 6,
      }),
    [candidateSlots, members, meetings, selectedParticipantIds]
  );

  function createMeeting() {
    if (!meetingTitle.trim() || selectedParticipantIds.length === 0) return;
    const m: Meeting = {
      id: `meeting-${Date.now()}`,
      title: meetingTitle.trim(),
      slot: meetingSlot,
      durationHours: 1,
      participantIds: selectedParticipantIds,
      priority: "normal",
      createdAt: Date.now(),
    };
    onCreateMeeting(m);
  }

  return (
    <>
      <div className="mb-5">
        <h2 className="text-base font-semibold">會議推薦與衝突檢查</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          選擇參與者與時段，系統會推薦最佳時段並提示衝突
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">會議草稿</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">標題</p>
              <Input
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">參與者</p>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const active = selectedParticipantIds.includes(m.id);
                  return (
                    <Button
                      key={m.id}
                      size="sm"
                      variant={active ? "default" : "outline"}
                      onClick={() => {
                        setSelectedParticipantIds((prev) =>
                          prev.includes(m.id)
                            ? prev.filter((x) => x !== m.id)
                            : [...prev, m.id]
                        );
                      }}
                    >
                      {m.name}
                    </Button>
                  );
                })}
              </div>
              {selectedParticipantIds.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  請至少選擇一位參與者
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">選擇時段</p>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={meetingSlot}
                onChange={(e) => setMeetingSlot(e.target.value)}
              >
                {candidateSlots.map((s) => (
                  <option key={s} value={s}>
                    {formatSlot(s)}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={createMeeting}
              disabled={selectedParticipantIds.length === 0}
              className="w-full"
            >
              建立會議
            </Button>

            {meetingConflicts.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                <p className="text-sm font-medium mb-1.5">偵測到衝突</p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {meetingConflicts.map((c) => {
                    const name =
                      members.find((m) => m.id === c.participantId)?.name ??
                      c.participantId;
                    const reason =
                      c.reason === "busy" ? "已有會議" : "不在空閒時間";
                    return (
                      <li key={`${c.participantId}-${c.slot}-${c.reason}`}>
                        {name}：{reason}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100">
                <p className="text-sm font-medium">目前選擇的時段沒有衝突</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              推薦時段（Top 6）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">請先選擇參與者</p>
            ) : (
              <div className="space-y-2">
                {recommendations.map((r) => {
                  const total = selectedParticipantIds.length;
                  const ok = r.availableParticipantIds.length;
                  return (
                    <button
                      key={r.slot}
                      className="w-full text-left rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                      onClick={() => setMeetingSlot(r.slot)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm">
                            {formatSlot(r.slot)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            出席 {ok}/{total} · 分數 {r.score}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          選用
                        </Badge>
                      </div>
                      {r.unavailableParticipantIds.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          無法出席：
                          {r.unavailableParticipantIds
                            .map(
                              (id) =>
                                members.find((m) => m.id === id)?.name ?? id
                            )
                            .join("、")}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

