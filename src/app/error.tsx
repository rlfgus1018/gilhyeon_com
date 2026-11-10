"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";

/** 세그먼트 오류 경계 — DB 장애 등으로 페이지를 만들 수 없을 때 (plan.md §2.1 "잠시 후 다시 시도") */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="space-y-8 py-12 sm:py-16">
      <PageHeader
        accent="brand"
        title="페이지를 잠시 불러올 수 없어요"
        lead="서버와 연결이 잠깐 끊겼을 수 있어요. 잠시 후 다시 시도해 주세요."
      />
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={reset}>
          다시 시도
        </Button>
        <Button size="lg" variant="outline" render={<Link href="/" />}>
          홈으로
        </Button>
      </div>
      {error.digest && (
        <p className="text-muted-foreground text-min font-mono">오류 ID {error.digest}</p>
      )}
    </Container>
  );
}
