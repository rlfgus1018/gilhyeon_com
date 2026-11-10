import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

export default function GuestbookLoading() {
  return (
    <Container className="space-y-8 py-12 sm:py-16" aria-busy="true">
      <PageHeader accent="violet" title="방명록" lead="메시지를 불러오는 중이에요…" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="card-surface bg-muted/40 h-36 animate-pulse" />
        ))}
      </div>
    </Container>
  );
}
