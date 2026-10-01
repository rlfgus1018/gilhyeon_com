"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/admin/tag-input";
import type { MediaRow } from "@/lib/supabase/types";

export type PostDraft = {
  id: string | null;
  title: string;
  slug: string;
  description: string;
  content_md: string;
  tags: string[];
  lang: "ko" | "en";
  featured: boolean;
  status: "draft" | "published";
  published_at: string | null;
  cover_media_id: string | null;
  updated_at: string | null;
};

type Props = {
  draft: PostDraft;
  onChange: (patch: Partial<PostDraft>) => void;
  fieldErrors: Record<string, string>;
  slugLocked: boolean;
  allTags: string[];
  cover: MediaRow | null;
  onPickCover: () => void;
};

/** ISO → datetime-local 값 (Asia/Seoul 기준 표시) */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PostMetaPanel({
  draft,
  onChange,
  fieldErrors,
  slugLocked,
  allTags,
  cover,
  onPickCover,
}: Props) {
  const err = (k: string) =>
    fieldErrors[k] && <p className="text-coral text-xs">{fieldErrors[k]}</p>;
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="slug">slug</Label>
        <Input
          id="slug"
          value={draft.slug}
          disabled={slugLocked}
          onChange={(e) => onChange({ slug: e.target.value })}
          placeholder="my-first-post"
          className="font-mono text-sm"
        />
        <p className="text-muted-foreground text-xs">
          {slugLocked
            ? "발행된 글의 주소는 바꿀 수 없어요."
            : "영문 소문자·숫자·하이픈. 발행 후 잠깁니다."}
        </p>
        {err("slug")}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">설명 ({draft.description.length}/200)</Label>
        <Textarea
          id="description"
          value={draft.description}
          rows={3}
          maxLength={200}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="목록과 검색 결과에 보이는 한 줄 요약"
        />
        {err("description")}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">태그 (최대 5)</Label>
        <TagInput
          id="tags"
          value={draft.tags}
          onChange={(tags) => onChange({ tags })}
          suggestions={allTags}
        />
        {err("tags")}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="lang">언어</Label>
          <select
            id="lang"
            value={draft.lang}
            onChange={(e) => onChange({ lang: e.target.value as "ko" | "en" })}
            className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="featured">피처드</Label>
          <div className="flex h-9 items-center">
            <Switch
              id="featured"
              checked={draft.featured}
              onCheckedChange={(v) => onChange({ featured: v })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="published_at">발행일</Label>
        <Input
          id="published_at"
          type="datetime-local"
          value={toLocalInput(draft.published_at)}
          onChange={(e) =>
            onChange({
              published_at: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
        />
        <p className="text-muted-foreground text-xs">
          비우면 발행 시각이 들어가요. 미래 시각은 그 시각까지 공개되지 않아요.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>커버 이미지</Label>
        {cover ? (
          <div className="bg-muted relative aspect-[1200/630] overflow-hidden rounded-xl">
            <Image
              src={cover.url}
              alt={cover.alt_default ?? ""}
              fill
              sizes="320px"
              className="object-cover"
              unoptimized={!cover.width}
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">없으면 제목으로 OG 이미지를 만들어요.</p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onPickCover}>
            {cover ? "변경" : "선택"}
          </Button>
          {cover && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ cover_media_id: null })}
            >
              제거
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
