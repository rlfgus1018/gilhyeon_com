"use client";

import { useRef, useState } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { registerMedia } from "@/app/admin/(gated)/media/actions";
import { MEDIA_BUCKET, MEDIA_EXT, MEDIA_MAX_BYTES, MEDIA_MIME } from "@/lib/admin/media";
import type { MediaRow } from "@/lib/supabase/types";

type Props = { onUploaded: (media: MediaRow) => void; multiple?: boolean; className?: string };

/** 브라우저 → Storage 직접 업로드(사용자 JWT, RLS) → 서버 액션으로 크기 기록 */
export function ImageUploader({ onUploaded, multiple = true, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      for (const file of Array.from(files)) {
        if (!(MEDIA_MIME as readonly string[]).includes(file.type))
          throw new Error(`${file.name}: 지원하지 않는 형식이에요.`);
        if (file.size > MEDIA_MAX_BYTES) throw new Error(`${file.name}: 5MB를 넘어요.`);
        const d = new Date();
        const path = `uploads/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${MEDIA_EXT[file.type]}`;
        const up = await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (up.error) throw new Error(`${file.name}: ${up.error.message}`);
        const reg = await registerMedia({ path, alt: file.name.replace(/\.[^.]+$/, "") });
        if (!reg.ok) throw new Error(`${file.name}: ${reg.message}`);
        onUploaded(reg.media);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드에 실패했어요.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={MEDIA_MIME.join(",")}
        multiple={multiple}
        className="sr-only"
        id="image-uploader-input"
        onChange={(e) => upload(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon aria-hidden />
        {busy ? "업로드 중…" : "이미지 업로드"}
      </Button>
      <p className="text-muted-foreground mt-1 text-xs">PNG·JPEG·WebP·GIF·AVIF, 5MB 이하</p>
      {error && (
        <p role="alert" className="text-coral mt-1 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
