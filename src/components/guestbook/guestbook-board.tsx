"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ComposeForm } from "@/components/guestbook/compose-form";
import { GuestbookCard } from "@/components/guestbook/guestbook-card";
import {
  deleteGuestbookEntry,
  loadGuestbookPage,
  setGuestbookHidden,
} from "@/app/guestbook/actions";
import type { GuestbookEntryView } from "@/lib/guestbook/list";

type Props = {
  initialEntries: GuestbookEntryView[];
  initialCursor: string | null;
  initialCount: number | null;
  canWrite: boolean;
  isAdmin: boolean;
};

/** 방명록 본문: 작성 폼 + 카드 그리드 + "더 보기". 변경 후에는 로컬 상태를 고쳐 즉시 반영한다. */
export function GuestbookBoard({
  initialEntries,
  initialCursor,
  initialCount,
  canWrite,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [cursor, setCursor] = useState(initialCursor);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadingMore, startMore] = useTransition();
  const [, startRow] = useTransition();

  const bump = (delta: number) => setCount((c) => (c === null ? c : Math.max(0, c + delta)));

  function handleFailure(r: { error: string; message: string }) {
    setError(r.message);
    if (r.error === "SESSION_EXPIRED") router.refresh();
  }

  function onDelete(id: string) {
    setBusyId(id);
    setError(null);
    startRow(async () => {
      const r = await deleteGuestbookEntry(id);
      if (r.ok) {
        const target = entries.find((e) => e.id === id);
        setEntries((list) => list.filter((e) => e.id !== id));
        if (target && !target.is_hidden) bump(-1);
      } else handleFailure(r);
      setBusyId(null);
    });
  }

  function onToggleHidden(id: string, hidden: boolean) {
    setBusyId(id);
    setError(null);
    startRow(async () => {
      const r = await setGuestbookHidden(id, hidden);
      if (r.ok) {
        setEntries((list) => list.map((e) => (e.id === id ? { ...e, is_hidden: hidden } : e)));
        bump(hidden ? -1 : 1);
      } else handleFailure(r);
      setBusyId(null);
    });
  }

  function loadMore() {
    if (!cursor) return;
    setError(null);
    startMore(async () => {
      const r = await loadGuestbookPage(cursor);
      if (r.ok) {
        setEntries((list) => {
          const seen = new Set(list.map((e) => e.id));
          return list.concat(r.entries.filter((e) => !seen.has(e.id)));
        });
        setCursor(r.nextCursor);
      } else handleFailure(r);
    });
  }

  return (
    <div className="space-y-8">
      {canWrite && (
        <ComposeForm
          onCreated={(entry) => {
            setEntries((list) => [entry, ...list]);
            bump(1);
          }}
          onSessionExpired={() => router.refresh()}
        />
      )}

      <section aria-labelledby="guestbook-list-heading" className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="guestbook-list-heading" className="text-lg font-semibold">
            남겨진 메시지
          </h2>
          {count !== null && (
            <p className="text-muted-foreground text-sm tabular-nums">
              {count.toLocaleString("ko-KR")}개
            </p>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="border-coral bg-coral-soft rounded-xl border px-4 py-3 text-sm"
          >
            {error}
          </p>
        )}

        {entries.length === 0 ? (
          <p className="card-surface text-muted-foreground p-10 text-center text-sm">
            아직 첫 메시지가 없어요. 첫 번째로 남겨볼까요?
          </p>
        ) : (
          <ul className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <GuestbookCard
                key={entry.id}
                entry={entry}
                isAdmin={isAdmin}
                busy={busyId === entry.id}
                onDelete={onDelete}
                onToggleHidden={onToggleHidden}
              />
            ))}
          </ul>
        )}

        {cursor && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "불러오는 중…" : "더 보기"}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
