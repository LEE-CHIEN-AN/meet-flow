"use client";

import { Badge } from "@/components/ui/badge";

export type NotificationItem = {
  id: string;
  message: string;
  createdAt: number;
  variant?: "default" | "secondary" | "outline";
};

export function Notifications({
  items,
}: {
  items: NotificationItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 pb-4">
      <div className="grid gap-2">
        {items.slice(0, 3).map((n) => (
          <div
            key={n.id}
            className="rounded-lg border bg-background/60 backdrop-blur px-3 py-2 flex items-start justify-between gap-3"
          >
            <p className="text-sm">{n.message}</p>
            <Badge variant={n.variant ?? "secondary"} className="text-xs shrink-0">
              通知
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

