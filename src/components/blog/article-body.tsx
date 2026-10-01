import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

/**
 * 저장된 content_html(저장 시 sanitize 완료)을 렌더한다. 방문자 입력은 절대 이 경로로 들어오지 않는다.
 * 클라이언트 아일랜드(코드 복사, 목차 스파이, YouTube)는 P3에서 추가.
 */
export function ArticleBody({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn("prose-article", className)}
      // 관리자가 작성해 서버에서 컴파일·정화한 HTML
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
