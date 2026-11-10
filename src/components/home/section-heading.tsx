import Link from "next/link";

/** 섹션 제목. 위쪽 굵은 선의 색이 콘텐츠 종류를 나타낸다(부모의 data-accent). */
export function SectionHeading({ id, title, href }: { id: string; title: string; href?: string }) {
  return (
    <div className="border-tone mb-6 flex items-baseline justify-between gap-4 border-t-4 pt-4">
      <h2 id={id} className="text-section font-bold">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-muted-foreground hover:text-foreground text-aux underline-offset-4 hover:underline"
        >
          전체 보기
        </Link>
      )}
    </div>
  );
}
