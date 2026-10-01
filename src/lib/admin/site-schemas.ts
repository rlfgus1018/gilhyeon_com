import { z } from "zod";

const uuid = z.string().uuid();
const short = (max: number) => z.string().trim().max(max);

/** site_content.data 키별 스키마 (plan.md §7.3) */
export const heroSchema = z.object({
  greeting: short(60).min(1, "인사말을 입력해 주세요"),
  intro: z.array(short(120)).min(1).max(3),
  avatar_media_id: uuid.nullable().default(null),
});
export const introSchema = z.object({
  md: z.string().max(50_000),
  html: z.string().default(""),
});
export const timelineSchema = z
  .array(
    z.object({
      period: short(40).min(1, "기간을 입력해 주세요"),
      title: short(80).min(1, "제목을 입력해 주세요"),
      description: short(300).default(""),
      tags: z.array(short(20)).max(4).default([]),
    }),
  )
  .max(30);
export const interestsSchema = z
  .array(z.object({ label: short(30).min(1), icon: short(40).default("") }))
  .max(12);
export const nowSchema = z.object({ items: z.array(short(120).min(1)).max(8) });
export const stackSchema = z
  .array(z.object({ key: short(40).min(1), label: short(40).min(1) }))
  .max(24);
export const photosSchema = z
  .array(
    z.object({
      media_id: uuid,
      alt: short(120).min(1, "대체 텍스트는 필수예요"),
      rotate: z.number().min(-12).max(12).default(0),
    }),
  )
  .max(10);

export const siteSchemas = {
  hero: heroSchema,
  intro: introSchema,
  timeline: timelineSchema,
  interests: interestsSchema,
  now: nowSchema,
  stack: stackSchema,
  photos: photosSchema,
} as const;
export type SiteKey = keyof typeof siteSchemas;
export type SiteData = { [K in SiteKey]: z.output<(typeof siteSchemas)[K]> };
export const SITE_KEYS = Object.keys(siteSchemas) as SiteKey[];
