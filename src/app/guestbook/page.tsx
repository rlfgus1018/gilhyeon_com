import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "방명록",
  alternates: { canonical: "/guestbook" },
};

/** 플레이스홀더 — 이후 Phase에서 교체된다. */
export default function Page() {
  return (
    <Container className="py-24">
      <h1 className="text-3xl font-bold">방명록</h1>
      <p className="text-muted-foreground mt-3">방명록은 곧 열려요.</p>
    </Container>
  );
}
