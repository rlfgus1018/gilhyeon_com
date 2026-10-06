import { revalidatePath } from "next/cache";

/** 콘텐츠 저장 시 만료시킬 경로 목록 (plan.md §2.1). 한 곳에서 관리한다. */
export function revalidatePost(slug: string, previousSlug?: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath(`/blog/${slug}/opengraph-image`);
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/blog/${previousSlug}`);
    revalidatePath(`/blog/${previousSlug}/opengraph-image`);
  }
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");
}

export function revalidateProject(slug: string, previousSlug?: string) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
  revalidatePath(`/projects/${slug}/opengraph-image`);
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/projects/${previousSlug}`);
    revalidatePath(`/projects/${previousSlug}/opengraph-image`);
  }
  revalidatePath("/sitemap.xml");
}

export function revalidateSiteContent() {
  revalidatePath("/");
  revalidatePath("/about");
}

export function revalidateGuestbook() {
  revalidatePath("/");
  revalidatePath("/guestbook");
}

/** 관리자 "캐시 새로고침" */
export function revalidateEverything() {
  revalidatePath("/", "layout");
}
