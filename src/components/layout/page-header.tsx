import type { ReactNode } from "react";

type Props = {
  /** 콘텐츠 종류를 나타내는 색 (design-audit.md §5.1) */
  accent: "brand" | "amber" | "mint" | "coral" | "violet";
  title: ReactNode;
  lead?: ReactNode;
  /** 제목 위 요소(뒤로 가기, 태그) */
  before?: ReactNode;
  /** 제목과 설명 아래 요소(메타, 링크) */
  children?: ReactNode;
};

/** 하위 페이지 공통 머리말. 위쪽 굵은 선의 색이 페이지의 콘텐츠 종류를 나타낸다. */
export function PageHeader({ accent, title, lead, before, children }: Props) {
  return (
    <header data-accent={accent} className="border-tone space-y-4 border-t-8 pt-6">
      {before}
      <h1 className="sm:text-page text-[2rem] leading-[1.2] font-bold">{title}</h1>
      {lead && <p className="text-muted-foreground text-item max-w-2xl">{lead}</p>}
      {children}
    </header>
  );
}
