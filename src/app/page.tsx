import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/lib/site-config";

/**
 * P0 홈 셸. P4에서 site_content 기반 히어로·사진 스트립·벤토·최신 글·My Site 섹션으로 확장된다.
 * DB 장애 시에도 이 fallback 문구는 항상 표시된다 (plan.md §3.1).
 */
export default function HomePage() {
  const { heroGreeting, heroIntro } = siteConfig.fallback;
  return (
    <Container className="py-20 sm:py-28">
      <section className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold sm:text-5xl">{heroGreeting}</h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            {heroIntro[0]} {heroIntro[1]}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" render={<Link href="/about" />}>
              소개 보기
              <ArrowRightIcon aria-hidden />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/guestbook" />}>
              방명록 남기기
            </Button>
          </div>
        </div>
        <div
          aria-hidden
          className="bg-brand-soft relative mx-auto size-44 rotate-3 rounded-[var(--radius-card)] sm:size-56"
        >
          <div className="bg-coral-soft absolute -right-4 -bottom-4 size-16 rounded-2xl" />
          <div className="bg-mint-soft absolute -top-4 -left-4 size-12 rounded-full" />
        </div>
      </section>
    </Container>
  );
}
