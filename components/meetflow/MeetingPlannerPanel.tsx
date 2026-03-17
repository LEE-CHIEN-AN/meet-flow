"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Meeting, Member, TimeSlot } from "@/features/scheduling/types";
import { DAYS, HOURS, formatSlot, slot } from "@/features/scheduling/slot";
import { detectConflicts } from "@/features/scheduling/conflicts";
import { recommendSlots } from "@/features/scheduling/recommendation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function makeId(prefix: string): string {
  try {
    // Browser runtime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rnd = (globalThis as any)?.crypto?.randomUUID?.();
    if (typeof rnd === "string" && rnd.length > 0) return `${prefix}-${rnd}`;
  } catch {
    // ignore
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function MeetingPlannerPanel({
  members,
  meetings,
  onCreateMeeting,
  onUpdateMeeting,
  onNotify,
  onNavigateToCalendar,
  selectedMeetingId,
  onSelectMeetingId,
  draftSlot,
  onDraftSlotChange,
  focusNonce,
}: {
  members: Member[];
  meetings: Meeting[];
  onCreateMeeting: (meeting: Meeting) => void;
  onUpdateMeeting: (meeting: Meeting) => void;
  onNotify: (message: string) => void;
  onNavigateToCalendar: () => void;
  selectedMeetingId: string | null;
  onSelectMeetingId: (id: string | null) => void;
  draftSlot: TimeSlot | null;
  onDraftSlotChange: (slotId: TimeSlot | null) => void;
  focusNonce: number;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"update" | "apply_best" | null>(
    null
  );

  const titleRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (!selectedMeetingId) return;
    const m = meetings.find((x) => x.id === selectedMeetingId);
    if (!m) return;
    setMeetingTitle(m.title);
    setMeetingSlot(m.slot);
    setSelectedParticipantIds(m.participantIds);
  }, [meetings, selectedMeetingId]);

  useEffect(() => {
    if (selectedMeetingId) return;
    if (!draftSlot) return;
    setMeetingSlot(draftSlot);
  }, [draftSlot, selectedMeetingId]);

  useEffect(() => {
    // When navigation jumps here from calendar, focus the title for fast editing
    const id = window.setTimeout(() => {
      titleRef.current?.focus();
      titleRef.current?.select?.();
    }, 0);
    return () => window.clearTimeout(id);
  }, [focusNonce]);

  function createMeeting() {
    if (!meetingTitle.trim() || selectedParticipantIds.length === 0) return;
    const m: Meeting = {
      id: makeId("meeting"),
      title: meetingTitle.trim(),
      slot: meetingSlot,
      durationHours: 1,
      participantIds: selectedParticipantIds,
      priority: "normal",
      createdAt: Date.now(),
    };
    onCreateMeeting(m);
    onSelectMeetingId(null);
    onDraftSlotChange(null);
    onNotify(`已建立會議「${m.title}」：${formatSlot(m.slot)}`);
    onNavigateToCalendar();
  }

  function doUpdateMeeting() {
    if (!selectedMeetingId) return;
    if (!meetingTitle.trim() || selectedParticipantIds.length === 0) return;
    const existing = meetings.find((m) => m.id === selectedMeetingId);
    if (!existing) return;
    const next = {
      ...existing,
      title: meetingTitle.trim(),
      slot: meetingSlot,
      participantIds: selectedParticipantIds,
    };
    onUpdateMeeting(next);
    onNotify(`已更新會議「${next.title}」：${formatSlot(next.slot)}`);
    onNavigateToCalendar();
  }

  function requestUpdateMeeting() {
    setConfirmMode("update");
    setConfirmOpen(true);
  }

  function requestApplyBestAlternative() {
    setConfirmMode("apply_best");
    setConfirmOpen(true);
  }

  function confirm() {
    if (confirmMode === "update") {
      doUpdateMeeting();
    } else if (confirmMode === "apply_best") {
      const best = recommendations[0];
      if (!best) return;
      setMeetingSlot(best.slot);
      // 套用替代時段屬於「草稿調整」，不視為同步通知事件
    }
    setConfirmOpen(false);
    setConfirmMode(null);
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
            <CardTitle className="text-base font-semibold">
              {selectedMeetingId ? "編輯會議" : "會議草稿"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">標題</p>
              <Input
                ref={titleRef}
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
                onChange={(e) => {
                  setMeetingSlot(e.target.value);
                  onDraftSlotChange(e.target.value);
                }}
              >
                {candidateSlots.map((s) => (
                  <option key={s} value={s}>
                    {formatSlot(s)}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={selectedMeetingId ? requestUpdateMeeting : createMeeting}
              disabled={selectedParticipantIds.length === 0}
              className="w-full"
            >
              {selectedMeetingId ? "更新會議" : "建立會議"}
            </Button>

            {meetingConflicts.length > 0 && recommendations.length > 0 && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={requestApplyBestAlternative}
              >
                一鍵套用最佳替代時段
              </Button>
            )}

            {selectedMeetingId && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onSelectMeetingId(null)}
              >
                取消編輯
              </Button>
            )}

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

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">已建立的會議</p>
              {meetings.length === 0 ? (
                <p className="text-sm text-muted-foreground">尚未建立會議</p>
              ) : (
                <div className="space-y-2">
                  {meetings.slice(0, 8).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`w-full text-left rounded-lg border p-3 hover:bg-muted/40 transition-colors ${
                        selectedMeetingId === m.id ? "bg-muted/40" : ""
                      }`}
                      onClick={() => onSelectMeetingId(m.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-sm">{m.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {formatSlot(m.slot)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        參與者：
                        {m.participantIds
                          .map(
                            (id) => members.find((mm) => mm.id === id)?.name ?? id
                          )
                          .join("、")}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmMode === "update" ? "確認更新會議" : "確認套用替代時段"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {confirmMode === "update"
                ? "系統將更新會議時間/參與者，並同步通知相關人員。"
                : "系統將套用推薦的最佳替代時段（僅更新草稿，不會同步通知）。"}
            </p>
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{meetingTitle.trim() || "（未命名）"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                時段：{formatSlot(confirmMode === "apply_best" ? (recommendations[0]?.slot ?? meetingSlot) : meetingSlot)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                參與者：{selectedParticipantIds.length} 人
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                取消
              </Button>
              <Button onClick={confirm}>
                {confirmMode === "update" ? "確認並通知" : "確認套用"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

