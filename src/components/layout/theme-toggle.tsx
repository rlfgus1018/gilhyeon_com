"use client";

import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 아이콘 전환은 CSS(dark: 변형)로 처리해 서버/클라이언트 마크업이 항상 같다.
 * (마운트 상태를 useEffect로 추적하면 하이드레이션 불일치와 lint 경고가 생긴다.)
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="라이트/다크 모드 전환"
      title="라이트/다크 모드 전환"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon aria-hidden className="hidden dark:inline" />
      <MoonIcon aria-hidden className="dark:hidden" />
    </Button>
  );
}
