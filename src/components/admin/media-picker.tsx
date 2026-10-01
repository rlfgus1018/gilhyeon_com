"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ImageUploader } from "@/components/admin/image-uploader";
import { listMedia } from "@/app/admin/(gated)/media/actions";
import type { MediaRow } from "@/lib/supabase/types";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; onSelect: (m: MediaRow) => void };

/** 업로드된 이미지에서 고르거나 새로 올려서 선택한다. */
export function MediaPicker({ open, onOpenChange, onSelect }: Props) {
  // items === null 이면 로딩 중
  const [items, setItems] = useState<MediaRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = items === null && !error;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listMedia(60).then((r) => {
      if (cancelled) return;
      if (r.ok) setItems(r.items);
      else setError(r.message);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(92vw,720px)] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>이미지 선택</SheetTitle>
          <SheetDescription>본문에 넣을 이미지를 고르거나 새로 올리세요.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <ImageUploader onUploaded={(m) => setItems((prev) => [m, ...(prev ?? [])])} />
          {error && <p className="text-coral text-sm">{error}</p>}
          {loading ? (
            <p className="text-muted-foreground text-sm">불러오는 중…</p>
          ) : !items || items.length === 0 ? (
            <p className="text-muted-foreground text-sm">아직 올린 이미지가 없어요.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {items.map((m) => (
                <li key={m.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="bg-muted relative aspect-square h-auto w-full overflow-hidden rounded-xl p-0"
                    onClick={() => onSelect(m)}
                    aria-label={`${m.alt_default ?? m.path} 선택`}
                  >
                    <Image
                      src={m.url}
                      alt={m.alt_default ?? ""}
                      fill
                      sizes="160px"
                      className="object-cover"
                      unoptimized={!m.width}
                    />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
