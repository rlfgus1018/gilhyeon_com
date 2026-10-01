import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "프로젝트",
  alternates: { canonical: "/projects" },
};

/** 플레이스홀더 — 이후 Phase에서 교체된다. */
export default function Page() {
  return (
    <Container className="py-24">
      <h1 className="text-3xl font-bold">프로젝트</h1>
      <p className="text-muted-foreground mt-3">프로젝트 목록을 준비하고 있어요.</p>
    </Container>
  );
}
