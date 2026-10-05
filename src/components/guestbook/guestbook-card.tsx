"use client";

import { useState } from "react";
import Image from "next/image";
import { EyeOffIcon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { GuestbookEntryView } from "@/lib/guestbook/list";
import { isGuestbookColor } from "@/lib/guestbook/moderation";

const dateFmt = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

type Props = {
  entry: GuestbookEntryView;
  isAdmin: boolean;
  busy: boolean;
  onDelete: (id: string) => void;
  onToggleHidden: (id: string, hidden: boolean) => void;
};

export function GuestbookCard({ entry, isAdmin, busy, onDelete, onToggleHidden }: Props) {
  const [confirming, setConfirming] = useState(false);
  const canDelete = entry.mine || isAdmin;
  const accent = isGuestbookColor(entry.color) ? entry.color : "brand";

  return (
    <li
      data-accent={accent}
      className={cn(
        "card-surface bg-tone-soft/50 flex flex-col gap-4 p-5",
        entry.is_hidden && "border-dashed opacity-70",
      )}
    >
      <p className="flex-1 text-[0.95rem] leading-relaxed break-words whitespace-pre-wrap">
        {entry.message}
      </p>
      <footer className="flex items-center gap-2.5">
        {entry.avatar_url ? (
          <Image
            src={entry.avatar_url}
            alt=""
            width={28}
            height={28}
            className="size-7 shrink-0 rounded-full"
          />
        ) : (
          <span
            aria-hidden
            className="bg-tone text-background grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold"
          >
            {[...entry.author_name][0] ?? "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {entry.author_name}
            {entry.mine && <span className="text-muted-foreground font-normal"> · 내 글</span>}
          </p>
          <p className="text-muted-foreground text-xs">
            <time dateTime={entry.created_at}>{dateFmt.format(new Date(entry.created_at))}</time>
            {entry.is_hidden && (
              <span className="ml-1.5 inline-flex items-center gap-1">
                <EyeOffIcon aria-hidden className="size-3" /> 숨김
              </span>
            )}
          </p>
        </div>

        {confirming ? (
          <span className="flex items-center gap-1 text-xs">
            삭제할까요?
            <Button
              size="xs"
              variant="destructive"
              disabled={busy}
              onClick={() => onDelete(entry.id)}
            >
              삭제
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setConfirming(false)}>
              취소
            </Button>
          </span>
        ) : (
          canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${entry.author_name} 님의 글 메뉴`}
                    disabled={busy}
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => onToggleHidden(entry.id, !entry.is_hidden)}>
                      {entry.is_hidden ? "다시 보이기" : "숨기기"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem variant="destructive" onClick={() => setConfirming(true)}>
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        )}
      </footer>
    </li>
  );
}
