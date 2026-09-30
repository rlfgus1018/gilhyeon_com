"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

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
    <Container className="py-24 text-center">
      <p className="text-coral text-sm font-semibold">문제가 생겼어요</p>
      <h1 className="mt-2 text-3xl font-bold">페이지를 잠시 불러올 수 없어요</h1>
      <p className="text-muted-foreground mt-3">잠시 후 다시 시도해 주세요.</p>
      <Button className="mt-8" onClick={reset}>
        다시 시도
      </Button>
    </Container>
  );
}
