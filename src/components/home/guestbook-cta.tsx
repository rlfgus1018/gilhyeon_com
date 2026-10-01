import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GuestbookCta() {
  return (
    <section
      data-accent="coral"
      className="card-surface bg-tone-soft/40 flex flex-col items-center gap-4 p-10 text-center"
    >
      <h2 className="text-2xl font-bold">지나가는 길에 한 줄 남겨주세요</h2>
      <p className="text-muted-foreground max-w-md">
        인사도 좋고, 글에 대한 의견도 좋아요. GitHub나 Google로 로그인하면 바로 남길 수 있어요.
      </p>
      <Button size="lg" render={<Link href="/guestbook" />}>
        방명록 쓰기 <ArrowRightIcon aria-hidden />
      </Button>
    </section>
  );
}
