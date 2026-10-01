"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { PreviewPane } from "@/components/admin/preview-pane";
import { MediaPicker } from "@/components/admin/media-picker";
import { ProjectMetaPanel, type ProjectDraft } from "@/components/admin/project-meta-panel";
import { saveProject, trashProject, restoreProject } from "@/app/admin/(gated)/projects/actions";
import { suggestSlug } from "@/lib/admin/slug";
import type { MediaRow } from "@/lib/supabase/types";

type Props = {
  initial: ProjectDraft | null;
  initialHtml?: string;
  trashed?: boolean;
  thumbnail: MediaRow | null;
};
const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = (): ProjectDraft => ({
  id: null,
  title: "",
  slug: "",
  summary: "",
  content_md: "",
  type: "ai",
  tech: [],
  links: { github: "", demo: "", post: "" },
  thumbnail_media_id: null,
  featured: false,
  work_status: "done",
  status: "draft",
  sort_date: today(),
  updated_at: null,
});
const TONE = {
  ok: "border-mint bg-mint-soft",
  warn: "border-amber bg-amber-soft",
  error: "border-coral bg-coral-soft",
} as const;

export function ProjectEditor({
  initial,
  initialHtml = "",
  trashed = false,
  thumbnail: initialThumb,
}: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<ProjectDraft>(initial ?? EMPTY());
  const [thumb, setThumb] = useState<MediaRow | null>(initialThumb);
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: keyof typeof TONE; text: string } | null>(null);
  const [picker, setPicker] = useState<"body" | "thumb" | null>(null);
  const [pending, start] = useTransition();
  const slugLocked = initial?.status === "published";

  const update = useCallback((p: Partial<ProjectDraft>) => {
    setDraft((d) => ({ ...d, ...p }));
    setDirty(true);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const save = (status: ProjectDraft["status"]) => {
    setFieldErrors({});
    const slug = draft.slug.trim() || suggestSlug(draft.title, "project");
    start(async () => {
      const r = await saveProject({
        ...draft,
        slug,
        status,
        expected_updated_at: draft.updated_at,
      });
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
      setNotice({ tone: "ok", text: status === "published" ? "공개했어요." : "저장했어요." });
      if (!draft.id) router.replace(`/admin/projects/${r.id}`);
    });
  };
  const onTrash = () =>
    start(async () => {
      if (!draft.id) return;
      const r = await trashProject(draft.id);
      if (r.ok) router.push("/admin/projects?status=trash");
      else setNotice({ tone: "error", text: r.message });
    });
  const onRestore = () =>
    start(async () => {
      if (!draft.id) return;
      const r = await restoreProject(draft.id);
      if (r.ok) router.refresh();
      else setNotice({ tone: "error", text: r.message });
    });

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-2">
        <Input
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="프로젝트 이름"
          aria-label="제목"
          className="h-11 flex-1 text-lg font-semibold"
        />
        {draft.id && (
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/admin/preview/project/${draft.id}`} target="_blank" />}
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
              {draft.status === "published" ? "업데이트" : "공개"}
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
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_280px]">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">
            본문(선택). 비우면 카드만 보이고 상세 페이지는 만들지 않아요.
          </p>
          <MarkdownEditor
            value={draft.content_md}
            onChange={(v) => update({ content_md: v })}
            onPickImage={() => setPicker("body")}
            minHeight="50vh"
          />
        </div>
        <PreviewPane markdown={draft.content_md} initialHtml={initialHtml} />
        <aside className="card-surface h-fit p-4">
          <ProjectMetaPanel
            draft={draft}
            onChange={update}
            fieldErrors={fieldErrors}
            slugLocked={slugLocked}
            thumbnail={thumb}
            onPickThumbnail={() => setPicker("thumb")}
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
          if (picker === "thumb") {
            setThumb(m);
            update({ thumbnail_media_id: m.id });
          } else
            update({
              content_md: `${draft.content_md}${!draft.content_md || draft.content_md.endsWith("\n") ? "" : "\n\n"}![${m.alt_default ?? ""}](${m.url})\n`,
            });
          setPicker(null);
        }}
      />
    </div>
  );
}
