import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";

/** 개인정보처리방침·서비스 약관 공용 틀. 본문은 prose-article 스타일을 그대로 쓴다. */
export function LegalPage({
  title,
  lead,
  effectiveDate,
  children,
}: {
  title: string;
  lead: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <Container className="py-12 sm:py-16">
      <article className="prose-article mx-auto max-w-3xl">
        <header className="not-prose mb-10 space-y-3">
          <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="text-muted-foreground text-lg">{lead}</p>
          <p className="text-muted-foreground text-sm">
            시행일: <time dateTime={effectiveDate}>{formatKo(effectiveDate)}</time>
          </p>
        </header>
        {children}
      </article>
    </Container>
  );
}

function formatKo(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
