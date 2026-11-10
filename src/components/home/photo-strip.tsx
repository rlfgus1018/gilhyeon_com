import Image from "next/image";
import type { SiteData } from "@/lib/admin/site-schemas";
import type { MediaRow } from "@/lib/supabase/types";

/** 가로로 정렬한 사진 스트립. 기울임과 hover 변형은 쓰지 않는다 (design-audit.md E4). */
export function PhotoStrip({
  photos,
  media,
}: {
  photos: SiteData["photos"];
  media: Map<string, MediaRow>;
}) {
  const items = photos.map((p) => ({ ...p, m: media.get(p.media_id) })).filter((p) => p.m);
  if (items.length === 0) return null;
  return (
    <section aria-label="사진" className="-mx-4 overflow-x-auto px-4 py-6 sm:-mx-6 sm:px-6">
      <ul className="flex w-max items-center gap-2 sm:gap-3">
        {items.map((p, i) => (
          <li key={`${p.media_id}-${i}`} className="relative h-44 w-36 shrink-0 sm:h-56 sm:w-44">
            <Image
              src={p.m!.url}
              alt={p.alt}
              fill
              sizes="(min-width: 640px) 176px, 144px"
              className="bg-card rounded-[var(--radius-card)] border object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
