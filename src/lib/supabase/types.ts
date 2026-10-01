/** DB 행 타입 (supabase/migrations/0001_init.sql 기준). CLI 연결 후 생성 타입으로 교체 예정. */
export type PostStatus = "draft" | "published";
export type Lang = "ko" | "en";

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content_md: string;
  content_html: string;
  toc: { depth: number; id: string; text: string }[];
  reading_minutes: number;
  tags: string[];
  lang: Lang;
  featured: boolean;
  status: PostStatus;
  published_at: string | null;
  cover_media_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content_md: string;
  content_html: string;
  toc: { depth: number; id: string; text: string }[];
  type: "ai" | "web" | "other";
  tech: string[];
  links: { github?: string; demo?: string; post?: string };
  thumbnail_media_id: string | null;
  featured: boolean;
  work_status: "done" | "wip" | "archived";
  status: PostStatus;
  sort_date: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MediaRow = {
  id: string;
  path: string;
  url: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  mime: string | null;
  alt_default: string | null;
  created_at: string;
};

export type SiteContentKey =
  "hero" | "intro" | "timeline" | "interests" | "now" | "stack" | "photos";
export type SiteContentRow = { key: SiteContentKey; data: unknown; updated_at: string };
