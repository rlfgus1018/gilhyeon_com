import { Container } from "@/components/layout/container";

export default function GuestbookLoading() {
  return (
    <Container className="space-y-8 py-16 sm:py-24" aria-busy="true">
      <header className="space-y-3">
        <p className="text-brand text-xs font-semibold tracking-wide uppercase">Guestbook</p>
        <h1 className="text-3xl font-bold sm:text-4xl">방명록</h1>
        <p className="text-muted-foreground">메시지를 불러오는 중이에요…</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="card-surface bg-muted/40 h-36 animate-pulse" />
        ))}
      </div>
    </Container>
  );
}
