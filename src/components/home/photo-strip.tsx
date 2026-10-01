import Image from "next/image";
import type { SiteData } from "@/lib/admin/site-schemas";
import type { MediaRow } from "@/lib/supabase/types";

/** 겹친 사진 스트립. 움직임은 hover 전용이며 reduced-motion에서는 변형이 없다. */
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
          <li
            key={`${p.media_id}-${i}`}
            style={{ "--rot": `${p.rotate}deg` } as React.CSSProperties}
            className="group relative h-44 w-36 shrink-0 [transform:rotate(var(--rot))] transition-transform duration-300 ease-out motion-safe:hover:z-10 motion-safe:hover:scale-105 motion-safe:hover:[transform:rotate(0deg)_scale(1.05)] sm:h-56 sm:w-44"
          >
            <Image
              src={p.m!.url}
              alt={p.alt}
              fill
              sizes="(min-width: 640px) 176px, 144px"
              className="bg-card rounded-2xl border object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
