"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/admin/tag-input";
import type { MediaRow } from "@/lib/supabase/types";

export type ProjectDraft = {
  id: string | null;
  title: string;
  slug: string;
  summary: string;
  content_md: string;
  type: "ai" | "web" | "other";
  tech: string[];
  links: { github: string; demo: string; post: string };
  thumbnail_media_id: string | null;
  featured: boolean;
  work_status: "done" | "wip" | "archived";
  status: "draft" | "published";
  sort_date: string;
  updated_at: string | null;
};

type Props = {
  draft: ProjectDraft;
  onChange: (p: Partial<ProjectDraft>) => void;
  fieldErrors: Record<string, string>;
  slugLocked: boolean;
  thumbnail: MediaRow | null;
  onPickThumbnail: () => void;
};

export function ProjectMetaPanel({
  draft,
  onChange,
  fieldErrors,
  slugLocked,
  thumbnail,
  onPickThumbnail,
}: Props) {
  const err = (k: string) =>
    fieldErrors[k] && <p className="text-coral text-xs">{fieldErrors[k]}</p>;
  const sel = "border-input bg-background h-9 w-full rounded-lg border px-3 text-sm";
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="slug">slug</Label>
        <Input
          id="slug"
          value={draft.slug}
          disabled={slugLocked}
          onChange={(e) => onChange({ slug: e.target.value })}
          className="font-mono text-sm"
        />
        {err("slug")}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="summary">한 줄 요약 ({draft.summary.length}/200)</Label>
        <Textarea
          id="summary"
          rows={2}
          maxLength={200}
          value={draft.summary}
          onChange={(e) => onChange({ summary: e.target.value })}
        />
        {err("summary")}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="type">유형</Label>
          <select
            id="type"
            className={sel}
            value={draft.type}
            onChange={(e) => onChange({ type: e.target.value as ProjectDraft["type"] })}
          >
            <option value="ai">AI / ML</option>
            <option value="web">Web</option>
            <option value="other">기타</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="work_status">진행 상태</Label>
          <select
            id="work_status"
            className={sel}
            value={draft.work_status}
            onChange={(e) =>
              onChange({ work_status: e.target.value as ProjectDraft["work_status"] })
            }
          >
            <option value="done">완료</option>
            <option value="wip">진행 중</option>
            <option value="archived">보관</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tech">기술 (최대 12)</Label>
        <TagInput id="tech" value={draft.tech} onChange={(tech) => onChange({ tech })} max={12} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="github">GitHub</Label>
        <Input
          id="github"
          value={draft.links.github}
          placeholder="https://github.com/…"
          onChange={(e) => onChange({ links: { ...draft.links, github: e.target.value } })}
        />
        {err("links.github")}
        <Label htmlFor="demo">데모</Label>
        <Input
          id="demo"
          value={draft.links.demo}
          placeholder="https://…"
          onChange={(e) => onChange({ links: { ...draft.links, demo: e.target.value } })}
        />
        {err("links.demo")}
        <Label htmlFor="post">관련 글</Label>
        <Input
          id="post"
          value={draft.links.post}
          placeholder="/blog/slug"
          onChange={(e) => onChange({ links: { ...draft.links, post: e.target.value } })}
        />
        {err("links.post")}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="sort_date">정렬 기준일</Label>
          <Input
            id="sort_date"
            type="date"
            value={draft.sort_date}
            onChange={(e) => onChange({ sort_date: e.target.value })}
          />
          {err("sort_date")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="featured">대표 프로젝트</Label>
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
        <Label>썸네일</Label>
        {thumbnail ? (
          <div className="bg-muted relative aspect-video overflow-hidden rounded-xl">
            <Image
              src={thumbnail.url}
              alt=""
              fill
              sizes="320px"
              className="object-cover"
              unoptimized={!thumbnail.width}
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">없으면 색 플레이스홀더가 보여요.</p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onPickThumbnail}>
            {thumbnail ? "변경" : "선택"}
          </Button>
          {thumbnail && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ thumbnail_media_id: null })}
            >
              제거
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
