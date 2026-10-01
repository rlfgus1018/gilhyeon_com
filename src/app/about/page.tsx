import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "소개",
  alternates: { canonical: "/about" },
};

/** 플레이스홀더 — 이후 Phase에서 교체된다. */
export default function Page() {
  return (
    <Container className="py-24">
      <h1 className="text-3xl font-bold">소개</h1>
      <p className="text-muted-foreground mt-3">소개 페이지는 준비 중이에요.</p>
    </Container>
  );
}
