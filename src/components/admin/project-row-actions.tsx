"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  publishProject,
  unpublishProject,
  trashProject,
  restoreProject,
  destroyProject,
} from "@/app/admin/(gated)/projects/actions";

type Props = {
  id: string;
  slug: string;
  status: "draft" | "published";
  trashed: boolean;
  hasBody: boolean;
};

export function ProjectRowActions({ id, slug, status, trashed, hasBody }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState<"trash" | "destroy" | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) alert(("message" in r && r.message) || "실패했어요.");
      setConfirm(null);
      router.refresh();
    });

  if (confirm) {
    return (
      <span className="flex items-center gap-1 text-xs">
        {confirm === "destroy" ? "영구 삭제할까요?" : "휴지통으로 보낼까요?"}
        <Button
          size="xs"
          variant="destructive"
          disabled={pending}
          onClick={() => run(() => (confirm === "destroy" ? destroyProject(id) : trashProject(id)))}
        >
          확인
        </Button>
        <Button size="xs" variant="ghost" onClick={() => setConfirm(null)}>
          취소
        </Button>
      </span>
    );
  }
  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="미리보기"
        render={<Link href={`/admin/preview/project/${id}`} target="_blank" />}
      >
        <EyeIcon />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="더 보기" disabled={pending} />}
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/admin/projects/${id}`} />}>편집</DropdownMenuItem>
          {trashed ? (
            <>
              <DropdownMenuItem onClick={() => run(() => restoreProject(id))}>
                복원
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setConfirm("destroy")}>
                영구 삭제
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {status === "published" ? (
                <>
                  {hasBody && (
                    <DropdownMenuItem render={<Link href={`/projects/${slug}`} target="_blank" />}>
                      공개 페이지 열기
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => run(() => unpublishProject(id))}>
                    초안으로 되돌리기
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => run(() => publishProject(id))}>
                  공개
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setConfirm("trash")}>
                휴지통
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
