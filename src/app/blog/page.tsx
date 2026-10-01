import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "블로그",
  alternates: { canonical: "/blog" },
};

/** 플레이스홀더 — 이후 Phase에서 교체된다. */
export default function Page() {
  return (
    <Container className="py-24">
      <h1 className="text-3xl font-bold">블로그</h1>
      <p className="text-muted-foreground mt-3">첫 글을 준비하고 있어요.</p>
    </Container>
  );
}
