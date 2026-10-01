import { z } from "zod";
import { SLUG_RE } from "@/lib/admin/slug";

const tag = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9가-힣]+(-[a-z0-9가-힣]+)*$/, "태그는 소문자·숫자·한글과 하이픈만 쓸 수 있어요")
  .max(30);

export const postInputSchema = z.object({
  id: z.string().uuid().nullable().default(null),
  title: z.string().trim().min(1, "제목을 입력해 주세요").max(120, "제목은 120자 이내"),
  slug: z.string().trim().regex(SLUG_RE, "slug는 영문 소문자·숫자·하이픈만").max(80),
  description: z.string().trim().max(200, "설명은 200자 이내").default(""),
  content_md: z.string().max(200_000, "본문이 너무 길어요").default(""),
  tags: z.array(tag).max(5, "태그는 최대 5개").default([]),
  lang: z.enum(["ko", "en"]).default("ko"),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
  published_at: z.string().datetime({ offset: true }).nullable().default(null),
  cover_media_id: z.string().uuid().nullable().default(null),
  /** 낙관적 충돌 검사: 편집 시작 시점의 updated_at */
  expected_updated_at: z.string().nullable().default(null),
});
export type PostInput = z.input<typeof postInputSchema>;
export type PostInputParsed = z.output<typeof postInputSchema>;

export const previewSchema = z.object({ content_md: z.string().max(200_000) });

export const projectInputSchema = z.object({
  id: z.string().uuid().nullable().default(null),
  title: z.string().trim().min(1, "제목을 입력해 주세요").max(120),
  slug: z.string().trim().regex(SLUG_RE, "slug는 영문 소문자·숫자·하이픈만").max(80),
  summary: z.string().trim().max(200, "요약은 200자 이내").default(""),
  content_md: z.string().max(200_000).default(""),
  type: z.enum(["ai", "web", "other"]).default("ai"),
  tech: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
  links: z
    .object({
      github: z.string().url("올바른 URL이 아니에요").or(z.literal("")).default(""),
      demo: z.string().url("올바른 URL이 아니에요").or(z.literal("")).default(""),
      post: z
        .string()
        .regex(/^\/blog\/[a-z0-9-]+$/, "/blog/slug 형식")
        .or(z.literal(""))
        .default(""),
    })
    .default({ github: "", demo: "", post: "" }),
  thumbnail_media_id: z.string().uuid().nullable().default(null),
  featured: z.boolean().default(false),
  work_status: z.enum(["done", "wip", "archived"]).default("done"),
  status: z.enum(["draft", "published"]).default("draft"),
  sort_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식"),
  expected_updated_at: z.string().nullable().default(null),
});
export type ProjectInput = z.input<typeof projectInputSchema>;
