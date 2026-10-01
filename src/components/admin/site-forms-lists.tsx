"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MediaPicker } from "@/components/admin/media-picker";
import type { SiteData } from "@/lib/admin/site-schemas";
import type { MediaRow } from "@/lib/supabase/types";

type F<K extends keyof SiteData> = {
  value: SiteData[K];
  onChange: (v: SiteData[K]) => void;
  errors?: Record<string, string>;
};

function move<T>(arr: T[], i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** 순서 조정은 드래그 대신 위/아래 버튼 (키보드 접근 가능) */
function Reorder({
  i,
  len,
  onMove,
  onRemove,
}: {
  i: number;
  len: number;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="위로"
        disabled={i === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUpIcon />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="아래로"
        disabled={i === len - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDownIcon />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="삭제" onClick={onRemove}>
        <Trash2Icon />
      </Button>
    </div>
  );
}

export function TimelineForm({ value, onChange, errors }: F<"timeline">) {
  const upd = (i: number, patch: Partial<SiteData["timeline"][number]>) =>
    onChange(value.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="space-y-3">
      {value.map((it, i) => (
        <div key={i} className="space-y-2 rounded-xl border p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="grid flex-1 gap-2 sm:grid-cols-[160px_1fr]">
              <Input
                value={it.period}
                placeholder="2024.03 – 현재"
                onChange={(e) => upd(i, { period: e.target.value })}
                aria-label="기간"
              />
              <Input
                value={it.title}
                placeholder="○○대학교 인공지능학과"
                onChange={(e) => upd(i, { title: e.target.value })}
                aria-label="제목"
              />
            </div>
            <Reorder
              i={i}
              len={value.length}
              onMove={(d) => onChange(move(value, i, d))}
              onRemove={() => onChange(value.filter((_, j) => j !== i))}
            />
          </div>
          <Textarea
            value={it.description}
            rows={2}
            placeholder="설명"
            onChange={(e) => upd(i, { description: e.target.value })}
            aria-label="설명"
          />
          <Input
            value={it.tags.join(", ")}
            placeholder="태그 (쉼표 구분, 최대 4)"
            onChange={(e) =>
              upd(i, {
                tags: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .slice(0, 4),
              })
            }
            aria-label="태그"
          />
          {(errors?.[`${i}.period`] || errors?.[`${i}.title`]) && (
            <p className="text-coral text-xs">{errors[`${i}.period`] ?? errors[`${i}.title`]}</p>
          )}
        </div>
      ))}
      {value.length < 30 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, { period: "", title: "", description: "", tags: [] }])}
        >
          항목 추가
        </Button>
      )}
    </div>
  );
}

export function PhotosForm({
  value,
  onChange,
  errors,
  media,
  onMedia,
}: F<"photos"> & { media: Record<string, MediaRow>; onMedia: (m: MediaRow) => void }) {
  const [picker, setPicker] = useState(false);
  const upd = (i: number, patch: Partial<SiteData["photos"][number]>) =>
    onChange(value.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        홈 상단 사진 스트립. 5~7장 권장, 각 사진에 대체 텍스트가 필요해요. 회전은 -12~12도.
      </p>
      {value.map((p, i) => {
        const m = media[p.media_id];
        return (
          <div key={`${p.media_id}-${i}`} className="flex items-start gap-3 rounded-xl border p-3">
            <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-lg">
              {m && <Image src={m.url} alt="" fill sizes="80px" className="object-cover" />}
            </div>
            <div className="grid flex-1 gap-2">
              <Input
                value={p.alt}
                placeholder="대체 텍스트 (필수)"
                onChange={(e) => upd(i, { alt: e.target.value })}
                aria-label="대체 텍스트"
              />
              <div className="flex items-center gap-2 text-xs">
                <label htmlFor={`rot-${i}`}>회전</label>
                <input
                  id={`rot-${i}`}
                  type="range"
                  min={-12}
                  max={12}
                  value={p.rotate}
                  onChange={(e) => upd(i, { rotate: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="w-10 text-right tabular-nums">{p.rotate}°</span>
              </div>
              {errors?.[`${i}.alt`] && <p className="text-coral text-xs">{errors[`${i}.alt`]}</p>}
            </div>
            <Reorder
              i={i}
              len={value.length}
              onMove={(d) => onChange(move(value, i, d))}
              onRemove={() => onChange(value.filter((_, j) => j !== i))}
            />
          </div>
        );
      })}
      {value.length < 10 && (
        <Button type="button" variant="outline" size="sm" onClick={() => setPicker(true)}>
          사진 추가
        </Button>
      )}
      <MediaPicker
        open={picker}
        onOpenChange={setPicker}
        onSelect={(m) => {
          onMedia(m);
          onChange([
            ...value,
            {
              media_id: m.id,
              alt: m.alt_default ?? "",
              rotate: (value.length % 2 ? -1 : 1) * (2 + (value.length % 3)),
            },
          ]);
          setPicker(false);
        }}
      />
    </div>
  );
}
