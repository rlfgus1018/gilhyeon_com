import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SiteData } from "@/lib/admin/site-schemas";
import type { MediaRow } from "@/lib/supabase/types";

export function Hero({ hero, avatar }: { hero: SiteData["hero"]; avatar: MediaRow | null }) {
  return (
    <section className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold sm:text-5xl">{hero.greeting}</h1>
        <p className="text-muted-foreground max-w-xl text-lg">{hero.intro.join(" ")}</p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" render={<Link href="/about" />}>
            소개 보기 <ArrowRightIcon aria-hidden />
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/guestbook" />}>
            방명록 남기기
          </Button>
        </div>
      </div>
      <div className="relative mx-auto size-44 sm:size-56">
        <div
          aria-hidden
          className="bg-brand-soft absolute inset-0 rotate-3 rounded-[var(--radius-card)]"
        />
        {avatar ? (
          <Image
            src={avatar.url}
            alt={`${hero.greeting.replace(/[^가-힣a-zA-Z ]/g, "").trim()} 프로필 사진`}
            fill
            priority
            sizes="(min-width: 640px) 224px, 176px"
            className="relative rounded-[var(--radius-card)] object-cover"
          />
        ) : (
          <div aria-hidden className="relative size-full">
            <div className="bg-coral-soft absolute -right-4 -bottom-4 size-16 rounded-2xl" />
            <div className="bg-mint-soft absolute -top-4 -left-4 size-12 rounded-full" />
          </div>
        )}
      </div>
    </section>
  );
}
