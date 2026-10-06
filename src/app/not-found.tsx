import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요",
  robots: { index: false, follow: false },
};

const SUGGESTIONS = [
  { href: "/blog", label: "블로그", sub: "배우고 만든 것을 기록한 글" },
  { href: "/projects", label: "프로젝트", sub: "만들어 본 것들" },
  { href: "/guestbook", label: "방명록", sub: "한마디 남기고 가기" },
];

export default function NotFound() {
  return (
    <Container className="py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-brand font-mono text-sm font-semibold tracking-wider">404</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">이 페이지는 없어요</h1>
        <p className="text-muted-foreground mt-3">
          주소가 바뀌었거나 아직 만들어지지 않은 페이지예요. 주소를 다시 확인해 주세요.
        </p>
        <Button className="mt-8" render={<Link href="/" />}>
          홈으로
        </Button>
      </div>
      <nav aria-label="대신 둘러보기" className="mx-auto mt-14 grid max-w-2xl gap-3 sm:grid-cols-3">
        {SUGGESTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="card-surface card-surface-hover p-4 text-left"
          >
            <p className="font-medium">{s.label}</p>
            <p className="text-muted-foreground mt-1 text-xs">{s.sub}</p>
          </Link>
        ))}
      </nav>
    </Container>
  );
}
