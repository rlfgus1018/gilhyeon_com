"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteGuestbookEntry, setGuestbookHidden } from "@/app/guestbook/actions";
import { blockGuestbookUser, unblockGuestbookUser } from "@/app/admin/(gated)/guestbook/actions";

type ActionResult = { ok: true } | { ok: false; message: string };

function useRowRunner() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<ActionResult>, done?: () => void) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.message);
      else done?.();
      router.refresh();
    });
  return { pending, error, run };
}

type EntryProps = {
  id: string;
  userId: string;
  authorName: string;
  hidden: boolean;
  blocked: boolean;
  isSelf: boolean;
};

/** 방명록 글 한 줄의 관리 메뉴: 숨기기/복원, 삭제(인라인 확인), 작성자 차단/해제 */
export function GuestbookRowActions({
  id,
  userId,
  authorName,
  hidden,
  blocked,
  isSelf,
}: EntryProps) {
  const uid = useId();
  const { pending, error, run } = useRowRunner();
  const [mode, setMode] = useState<"menu" | "delete" | "block">("menu");
  const [reason, setReason] = useState("");
  const [hideAll, setHideAll] = useState(true);
  const close = () => setMode("menu");

  if (mode === "delete") {
    return (
      <span className="flex items-center gap-1 text-xs">
        삭제할까요?
        <Button
          size="xs"
          variant="destructive"
          disabled={pending}
          onClick={() => run(() => deleteGuestbookEntry(id), close)}
        >
          확인
        </Button>
        <Button size="xs" variant="ghost" onClick={close}>
          취소
        </Button>
      </span>
    );
  }

  if (mode === "block") {
    return (
      <form
        className="bg-muted/50 w-full space-y-2 rounded-xl p-3 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => blockGuestbookUser({ userId, reason, hideAll }), close);
        }}
      >
        <p className="font-medium">{authorName} 님을 차단할까요?</p>
        <p className="text-muted-foreground text-xs">차단하면 이 계정은 방명록을 쓸 수 없어요.</p>
        <label htmlFor={`${uid}-reason`} className="sr-only">
          차단 사유
        </label>
        <Input
          id={`${uid}-reason`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={200}
          placeholder="차단 사유 (선택, 관리자만 봄)"
        />
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={hideAll} onChange={(e) => setHideAll(e.target.checked)} />
          이 사용자의 글 모두 숨기기
        </label>
        {error && (
          <p role="alert" className="text-destructive text-xs">
            {error}
          </p>
        )}
        <div className="flex gap-1">
          <Button type="submit" size="xs" variant="destructive" disabled={pending}>
            차단
          </Button>
          <Button type="button" size="xs" variant="ghost" onClick={close}>
            취소
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${authorName} 님의 글 관리`}
              disabled={pending}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => run(() => setGuestbookHidden(id, !hidden))}>
            {hidden ? "복원" : "숨기기"}
          </DropdownMenuItem>
          {blocked ? (
            <DropdownMenuItem onClick={() => run(() => unblockGuestbookUser(userId))}>
              작성자 차단 해제
            </DropdownMenuItem>
          ) : (
            !isSelf && (
              <DropdownMenuItem onClick={() => setMode("block")}>작성자 차단</DropdownMenuItem>
            )
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setMode("delete")}>
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** 차단 사용자 목록의 해제 버튼 */
export function UnblockButton({ userId, label }: { userId: string; label: string }) {
  const { pending, error, run } = useRowRunner();
  return (
    <span className="flex items-center gap-2">
      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        aria-label={`${label} 차단 해제`}
        onClick={() => run(() => unblockGuestbookUser(userId))}
      >
        차단 해제
      </Button>
    </span>
  );
}
