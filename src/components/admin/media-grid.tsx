"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { CopyIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { deleteMedia } from "@/app/admin/(gated)/media/actions";
import type { MediaRow } from "@/lib/supabase/types";

function fmtBytes(b: number | null) {
  if (!b) return "";
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB` : `${Math.round(b / 1024)}KB`;
}

export function MediaGrid({ initial }: { initial: MediaRow[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState<{ id: string; message?: string; force?: boolean } | null>(
    null,
  );
  const [copied, setCopied] = useState<string | null>(null);

  const remove = (id: string, force = false) =>
    start(async () => {
      const r = await deleteMedia(id, force);
      if (r.ok) {
        setItems((xs) => xs.filter((x) => x.id !== id));
        setConfirm(null);
      } else if ("refs" in r && r.refs) {
        setConfirm({ id, message: r.message, force: true });
      } else {
        setConfirm({ id, message: r.message });
      }
    });

  return (
    <div className="space-y-6">
      <ImageUploader onUploaded={(m) => setItems((xs) => [m, ...xs])} />
      {items.length === 0 ? (
        <p className="text-muted-foreground card-surface p-8 text-center text-sm">
          아직 올린 이미지가 없어요.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <li key={m.id} className="card-surface overflow-hidden">
              <div className="bg-muted relative aspect-square">
                <Image
                  src={m.url}
                  alt={m.alt_default ?? ""}
                  fill
                  sizes="240px"
                  className="object-cover"
                  unoptimized={!m.width}
                />
              </div>
              <div className="space-y-1 p-3 text-xs">
                <p className="truncate font-medium" title={m.alt_default ?? m.path}>
                  {m.alt_default ?? m.path.split("/").pop()}
                </p>
                <p className="text-muted-foreground">
                  {m.width && m.height ? `${m.width}×${m.height}` : "크기 미상"} {fmtBytes(m.bytes)}
                </p>
                {confirm?.id === m.id ? (
                  <div className="space-y-1">
                    <p className="text-coral">{confirm.message ?? "삭제할까요?"}</p>
                    <div className="flex gap-1">
                      <Button
                        size="xs"
                        variant="destructive"
                        disabled={pending}
                        onClick={() => remove(m.id, !!confirm.force)}
                      >
                        {confirm.force ? "그래도 삭제" : "삭제"}
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => setConfirm(null)}>
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`![${m.alt_default ?? ""}](${m.url})`);
                        setCopied(m.id);
                        setTimeout(() => setCopied(null), 1500);
                      }}
                    >
                      <CopyIcon /> {copied === m.id ? "복사됨" : "Markdown"}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      aria-label="삭제"
                      onClick={() => setConfirm({ id: m.id })}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
