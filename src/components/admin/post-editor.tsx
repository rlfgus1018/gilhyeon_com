"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { PostMetaPanel, type PostDraft } from "@/components/admin/post-meta-panel";
import { PreviewPane } from "@/components/admin/preview-pane";
import { MediaPicker } from "@/components/admin/media-picker";
import { savePost, trashPost, restorePost } from "@/app/admin/(gated)/posts/actions";
import { suggestSlug } from "@/lib/admin/slug";
import type { MediaRow } from "@/lib/supabase/types";

type Props = {
  initial: PostDraft | null;
  initialHtml?: string;
  trashed?: boolean;
  allTags: string[];
  cover: MediaRow | null;
};
type Notice = { tone: "ok" | "warn" | "error"; text: string };

const EMPTY: PostDraft = {
  id: null,
  title: "",
  slug: "",
  description: "",
  content_md: "",
  tags: [],
  lang: "ko",
  featured: false,
  status: "draft",
  published_at: null,
  cover_media_id: null,
  updated_at: null,
};
const AUTOSAVE_MS = 30_000;
const TONE = {
  ok: "border-mint bg-mint-soft",
  warn: "border-amber bg-amber-soft",
  error: "border-coral bg-coral-soft",
} as const;

function readBackup(key: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as { content_md: string; at: string }) : null;
  } catch {
    return null;
  }
}
function writeBackup(key: string, content_md: string) {
  try {
    localStorage.setItem(key, JSON.stringify({ content_md, at: new Date().toISOString() }));
  } catch {}
}
function clearBackup(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function PostEditor({
  initial,
  initialHtml = "",
  trashed = false,
  allTags,
  cover: initialCover,
}: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<PostDraft>(initial ?? EMPTY);
  const [cover, setCover] = useState<MediaRow | null>(initialCover);
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [picker, setPicker] = useState<"body" | "cover" | null>(null);
  const [pending, startTransition] = useTransition();
  const storageKey = `post-draft:${draft.id ?? "new"}`;
  const [backup, setBackup] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = readBackup(`post-draft:${initial?.id ?? "new"}`);
    if (!saved?.content_md || saved.content_md === (initial?.content_md ?? "")) return null;
    if (initial?.updated_at && saved.at <= initial.updated_at) return null;
    return saved.content_md;
  });
  const slugLocked = initial?.status === "published";

  const update = useCallback((patch: Partial<PostDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  }, []);

  // 로컬 백업(1초 디바운스) — 탭 종료에 대비
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => writeBackup(storageKey, draft.content_md), 1000);
    return () => clearTimeout(t);
  }, [draft.content_md, dirty, storageKey]);

  // 이탈 경고
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const save = useCallback(
    (status: PostDraft["status"]) => {
      setFieldErrors({});
      const slug = draft.slug.trim() || suggestSlug(draft.title);
      startTransition(async () => {
        const r = await savePost({ ...draft, slug, status, expected_updated_at: draft.updated_at });
        if (!r.ok) {
          if (r.fields) setFieldErrors(r.fields);
          setNotice({ tone: r.error === "CONFLICT" ? "warn" : "error", text: r.message });
          return;
        }
        setDraft((d) => ({
          ...d,
          id: r.id,
          slug: r.slug,
          status: r.status,
          updated_at: r.updated_at,
        }));
        setDirty(false);
        setWarnings(r.warnings);
        setNotice({ tone: "ok", text: status === "published" ? "발행했어요." : "저장했어요." });
        clearBackup(storageKey);
        if (!draft.id) router.replace(`/admin/posts/${r.id}`);
      });
    },
    [draft, router, storageKey],
  );

  // 자동 저장 (기존 글만, 변경이 있을 때, 상태 유지)
  useEffect(() => {
    if (!dirty || !draft.id || pending) return;
    const t = setTimeout(() => save(draft.status), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [dirty, draft.id, draft.status, pending, save]);

  const onTrash = () =>
    startTransition(async () => {
      if (!draft.id) return;
      const r = await trashPost(draft.id);
      if (r.ok) router.push("/admin/posts?status=trash");
      else setNotice({ tone: "error", text: r.message });
    });
  const onRestore = () =>
    startTransition(async () => {
      if (!draft.id) return;
      const r = await restorePost(draft.id);
      if (r.ok) router.refresh();
      else setNotice({ tone: "error", text: r.message });
    });
  const insertImage = (m: MediaRow) => {
    const sep = !draft.content_md || draft.content_md.endsWith("\n") ? "" : "\n\n";
    update({ content_md: `${draft.content_md}${sep}![${m.alt_default ?? ""}](${m.url})\n` });
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-2">
        <Input
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="제목"
          aria-label="제목"
          className="h-11 flex-1 text-lg font-semibold"
        />
        {draft.id && (
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/admin/preview/post/${draft.id}`} target="_blank" />}
          >
            미리보기
          </Button>
        )}
        {trashed ? (
          <Button variant="outline" size="sm" disabled={pending} onClick={onRestore}>
            복원
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" disabled={pending} onClick={() => save("draft")}>
              {draft.status === "published" ? "초안으로 되돌리기" : "초안 저장"}
            </Button>
            <Button size="sm" disabled={pending} onClick={() => save("published")}>
              {draft.status === "published" ? "업데이트" : "발행"}
            </Button>
            {draft.id && (
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={onTrash}
                className="text-coral"
              >
                휴지통
              </Button>
            )}
          </>
        )}
      </header>

      {fieldErrors.title && <p className="text-coral text-xs">{fieldErrors.title}</p>}
      {backup && (
        <div className="border-amber bg-amber-soft flex flex-wrap items-center gap-2 rounded-xl border px-4 py-2 text-sm">
          저장되지 않은 본문 백업이 있어요.
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              update({ content_md: backup });
              setBackup(null);
            }}
          >
            복구
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setBackup(null);
              clearBackup(storageKey);
            }}
          >
            무시
          </Button>
        </div>
      )}
      {notice && (
        <p role="status" className={`rounded-xl border px-4 py-2 text-sm ${TONE[notice.tone]}`}>
          {notice.text}
          {notice.tone === "warn" && (
            <button type="button" className="ml-2 underline" onClick={() => router.refresh()}>
              새로 고침
            </button>
          )}
        </p>
      )}
      {warnings.length > 0 && (
        <ul className="border-amber bg-amber-soft rounded-xl border px-4 py-2 text-xs">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_280px]">
        <MarkdownEditor
          value={draft.content_md}
          onChange={(v) => update({ content_md: v })}
          onPickImage={() => setPicker("body")}
        />
        <PreviewPane markdown={draft.content_md} initialHtml={initialHtml} />
        <aside className="card-surface h-fit p-4">
          <PostMetaPanel
            draft={draft}
            onChange={update}
            fieldErrors={fieldErrors}
            slugLocked={slugLocked}
            allTags={allTags}
            cover={cover}
            onPickCover={() => setPicker("cover")}
          />
          <p className="text-muted-foreground mt-4 text-xs">
            {dirty
              ? "저장되지 않은 변경이 있어요"
              : draft.updated_at
                ? `마지막 저장 ${new Date(draft.updated_at).toLocaleString("ko-KR")}`
                : "아직 저장하지 않았어요"}
          </p>
        </aside>
      </div>

      <MediaPicker
        open={picker !== null}
        onOpenChange={(o) => !o && setPicker(null)}
        onSelect={(m) => {
          if (picker === "cover") {
            setCover(m);
            update({ cover_media_id: m.id });
          } else insertImage(m);
          setPicker(null);
        }}
      />
    </div>
  );
}
