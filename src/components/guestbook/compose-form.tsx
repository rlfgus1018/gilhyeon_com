"use client";

import { useId, useState, useTransition } from "react";
import { SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createGuestbookEntry } from "@/app/guestbook/actions";
import type { GuestbookEntryView } from "@/lib/guestbook/list";
import {
  COLOR_LABELS,
  GUESTBOOK_COLORS,
  MESSAGE_MAX,
  messageLength,
  type GuestbookColor,
} from "@/lib/guestbook/moderation";

type Props = {
  onCreated: (entry: GuestbookEntryView) => void;
  onSessionExpired: () => void;
};

export function ComposeForm({ onCreated, onSessionExpired }: Props) {
  const uid = useId();
  const [message, setMessage] = useState("");
  const [color, setColor] = useState<GuestbookColor>("brand");
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const length = messageLength(message.trim());
  const over = length > MESSAGE_MAX;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || length === 0 || over) return;
    start(async () => {
      const r = await createGuestbookEntry({ message, color });
      if (r.ok) {
        setMessage("");
        setNotice({ tone: "ok", text: "남겨주셔서 고마워요!" });
        onCreated(r.entry);
      } else {
        setNotice({ tone: "error", text: r.message });
        if (r.error === "SESSION_EXPIRED") onSessionExpired();
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      data-accent={color}
      className="card-surface bg-tone-soft/40 space-y-4 p-5"
      aria-label="방명록 작성"
    >
      <div className="space-y-1.5">
        <label htmlFor={`${uid}-message`} className="text-sm font-medium">
          메시지
        </label>
        <Textarea
          id={`${uid}-message`}
          name="message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (notice) setNotice(null);
          }}
          placeholder="인사, 응원, 글에 대한 의견 모두 좋아요."
          rows={3}
          className="bg-card min-h-24"
          aria-invalid={over || undefined}
          aria-describedby={`${uid}-hint`}
          disabled={pending}
          required
        />
        <p id={`${uid}-hint`} className="text-muted-foreground flex justify-between gap-3 text-xs">
          <span>링크는 넣을 수 없어요. 1분에 1개, 하루 5개까지 남길 수 있어요.</span>
          <span className={cn("tabular-nums", over && "text-destructive font-medium")}>
            {length}/{MESSAGE_MAX}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <fieldset>
          <legend className="text-sm font-medium">카드 색상</legend>
          <div className="mt-2 flex gap-2">
            {GUESTBOOK_COLORS.map((c) => (
              <label key={c} data-accent={c} className="cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={c}
                  checked={color === c}
                  onChange={() => setColor(c)}
                  className="peer sr-only"
                  disabled={pending}
                />
                <span
                  aria-hidden
                  className="bg-tone ring-offset-background peer-checked:ring-foreground peer-focus-visible:ring-ring block size-7 rounded-full ring-2 ring-transparent ring-offset-2 transition-shadow"
                />
                <span className="sr-only">{COLOR_LABELS[c]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Button type="submit" disabled={pending || length === 0 || over}>
          <SendIcon aria-hidden />
          {pending ? "남기는 중…" : "남기기"}
        </Button>
      </div>

      <p
        role={notice?.tone === "error" ? "alert" : "status"}
        aria-live="polite"
        className={cn(
          "text-sm empty:hidden",
          notice?.tone === "error" ? "text-destructive" : "text-foreground",
        )}
      >
        {notice?.text}
      </p>
    </form>
  );
}
