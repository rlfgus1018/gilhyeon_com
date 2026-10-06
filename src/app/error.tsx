"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

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
    <Container className="py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-coral font-mono text-sm font-semibold tracking-wider">500</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">페이지를 잠시 불러올 수 없어요</h1>
        <p className="text-muted-foreground mt-3">
          서버와 연결이 잠깐 끊겼을 수 있어요. 잠시 후 다시 시도해 주세요.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>다시 시도</Button>
          <Button variant="outline" render={<Link href="/" />}>
            홈으로
          </Button>
        </div>
        {error.digest && (
          <p className="text-muted-foreground mt-8 font-mono text-xs">오류 ID {error.digest}</p>
        )}
      </div>
    </Container>
  );
}
