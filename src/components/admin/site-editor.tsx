"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveSiteContent } from "@/app/admin/(gated)/site/actions";
import type { SiteData, SiteKey } from "@/lib/admin/site-schemas";
import type { MediaRow } from "@/lib/supabase/types";
import {
  HeroForm,
  IntroForm,
  NowForm,
  InterestsForm,
  StackForm,
} from "@/components/admin/site-forms-basic";
import { TimelineForm, PhotosForm } from "@/components/admin/site-forms-lists";
import { cn } from "@/lib/utils";

const TABS: { key: SiteKey; label: string; hint: string }[] = [
  { key: "hero", label: "히어로", hint: "홈 첫 화면 인사말과 프로필 사진" },
  { key: "intro", label: "소개", hint: "/about 본문 (Markdown)" },
  { key: "timeline", label: "타임라인", hint: "학력·활동 연혁" },
  { key: "interests", label: "관심 분야", hint: "/about 관심 분야 칩" },
  { key: "now", label: "현재", hint: "홈 '요즘' 카드 항목" },
  { key: "stack", label: "스택", hint: "홈 도구 카드 (simple-icons 키)" },
  { key: "photos", label: "사진", hint: "홈 사진 스트립 (대체 텍스트 필수)" },
];

type Props = { initial: SiteData; media: Record<string, MediaRow> };

export function SiteEditor({ initial, media }: Props) {
  const [tab, setTab] = useState<SiteKey>("hero");
  const [data, setData] = useState<SiteData>(initial);
  const [dirty, setDirty] = useState<Partial<Record<SiteKey, boolean>>>({});
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mediaMap, setMediaMap] = useState(media);
  const [pending, start] = useTransition();

  const set = <K extends SiteKey>(key: K, value: SiteData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setDirty((x) => ({ ...x, [key]: true }));
  };
  const save = (key: SiteKey) =>
    start(async () => {
      setErrors({});
      const r = await saveSiteContent(key, data[key]);
      if (r.ok) {
        setDirty((x) => ({ ...x, [key]: false }));
        setNotice({ ok: true, text: "저장했어요. 홈·소개 페이지가 갱신됩니다." });
      } else {
        setErrors(r.fields ?? {});
        setNotice({ ok: false, text: r.message });
      }
    });
  const addMedia = (m: MediaRow) => setMediaMap((x) => ({ ...x, [m.id]: m }));
  const current = TABS.find((t) => t.key === tab)!;

  return (
    <div className="grid gap-6 md:grid-cols-[180px_1fr]">
      <nav aria-label="사이트 콘텐츠" className="flex flex-row flex-wrap gap-1 md:flex-col">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn(
              "flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm",
              tab === t.key ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/60",
            )}
          >
            {t.label}
            {dirty[t.key] && (
              <span aria-label="저장되지 않음" className="bg-amber size-1.5 rounded-full" />
            )}
          </button>
        ))}
      </nav>

      <section className="card-surface space-y-5 p-5">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{current.label}</h2>
            <p className="text-muted-foreground text-xs">{current.hint}</p>
          </div>
          <Button size="sm" disabled={pending || !dirty[tab]} onClick={() => save(tab)}>
            {pending ? "저장 중…" : "저장"}
          </Button>
        </header>
        {notice && (
          <p
            role="status"
            className={cn(
              "rounded-xl border px-4 py-2 text-sm",
              notice.ok ? "border-mint bg-mint-soft" : "border-coral bg-coral-soft",
            )}
          >
            {notice.text}
          </p>
        )}

        {tab === "hero" && (
          <HeroForm
            value={data.hero}
            onChange={(v) => set("hero", v)}
            errors={errors}
            media={mediaMap}
            onMedia={addMedia}
          />
        )}
        {tab === "intro" && <IntroForm value={data.intro} onChange={(v) => set("intro", v)} />}
        {tab === "timeline" && (
          <TimelineForm
            value={data.timeline}
            onChange={(v) => set("timeline", v)}
            errors={errors}
          />
        )}
        {tab === "interests" && (
          <InterestsForm value={data.interests} onChange={(v) => set("interests", v)} />
        )}
        {tab === "now" && <NowForm value={data.now} onChange={(v) => set("now", v)} />}
        {tab === "stack" && <StackForm value={data.stack} onChange={(v) => set("stack", v)} />}
        {tab === "photos" && (
          <PhotosForm
            value={data.photos}
            onChange={(v) => set("photos", v)}
            errors={errors}
            media={mediaMap}
            onMedia={addMedia}
          />
        )}
      </section>
    </div>
  );
}
