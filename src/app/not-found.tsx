import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요",
  robots: { index: false, follow: false },
};

const SUGGESTIONS = [
  { href: "/blog", label: "블로그" },
  { href: "/projects", label: "프로젝트" },
  { href: "/guestbook", label: "방명록" },
];

export default function NotFound() {
  return (
    <Container className="space-y-8 py-12 sm:py-16">
      <PageHeader
        accent="brand"
        title="이 페이지는 없어요"
        lead="주소가 바뀌었거나 아직 만들어지지 않은 페이지예요. 주소를 다시 확인해 주세요."
      />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button size="lg" render={<Link href="/" />}>
          홈으로
        </Button>
        <nav aria-label="대신 둘러보기" className="text-body flex flex-wrap gap-x-5">
          {SUGGESTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="underline underline-offset-4">
              {s.label}
            </Link>
          ))}
        </nav>
      </div>
    </Container>
  );
}
