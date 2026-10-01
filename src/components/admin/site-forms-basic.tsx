"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { MediaPicker } from "@/components/admin/media-picker";
import type { SiteData } from "@/lib/admin/site-schemas";
import type { MediaRow } from "@/lib/supabase/types";

type F<K extends keyof SiteData> = {
  value: SiteData[K];
  onChange: (v: SiteData[K]) => void;
  errors?: Record<string, string>;
};
const Err = ({ k, errors }: { k: string; errors?: Record<string, string> }) =>
  errors?.[k] ? <p className="text-coral text-xs">{errors[k]}</p> : null;

export function HeroForm({
  value,
  onChange,
  errors,
  media,
  onMedia,
}: F<"hero"> & { media: Record<string, MediaRow>; onMedia: (m: MediaRow) => void }) {
  const [picker, setPicker] = useState(false);
  const avatar = value.avatar_media_id ? media[value.avatar_media_id] : null;
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="greeting">인사말</Label>
        <Input
          id="greeting"
          value={value.greeting}
          onChange={(e) => onChange({ ...value, greeting: e.target.value })}
        />
        <Err k="greeting" errors={errors} />
      </div>
      <div className="space-y-1.5">
        <Label>소개 문장 (최대 3)</Label>
        {value.intro.map((line, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={line}
              onChange={(e) =>
                onChange({
                  ...value,
                  intro: value.intro.map((x, j) => (j === i ? e.target.value : x)),
                })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={value.intro.length <= 1}
              onClick={() => onChange({ ...value, intro: value.intro.filter((_, j) => j !== i) })}
            >
              삭제
            </Button>
          </div>
        ))}
        {value.intro.length < 3 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...value, intro: [...value.intro, ""] })}
          >
            문장 추가
          </Button>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>프로필 사진</Label>
        <div className="flex items-center gap-3">
          <div className="bg-muted relative size-20 overflow-hidden rounded-full">
            {avatar && <Image src={avatar.url} alt="" fill sizes="80px" className="object-cover" />}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setPicker(true)}>
            {avatar ? "변경" : "선택"}
          </Button>
          {avatar && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange({ ...value, avatar_media_id: null })}
            >
              제거
            </Button>
          )}
        </div>
      </div>
      <MediaPicker
        open={picker}
        onOpenChange={setPicker}
        onSelect={(m) => {
          onMedia(m);
          onChange({ ...value, avatar_media_id: m.id });
          setPicker(false);
        }}
      />
    </div>
  );
}

export function IntroForm({ value, onChange }: F<"intro">) {
  return (
    <MarkdownEditor
      value={value.md}
      onChange={(md) => onChange({ ...value, md })}
      minHeight="40vh"
    />
  );
}

export function NowForm({ value, onChange }: F<"now">) {
  const items = value.items;
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={it}
            placeholder="예: 3학년 2학기 · 딥러닝 수강 중"
            onChange={(e) =>
              onChange({ items: items.map((x, j) => (j === i ? e.target.value : x)) })
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ items: items.filter((_, j) => j !== i) })}
          >
            삭제
          </Button>
        </div>
      ))}
      {items.length < 8 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ items: [...items, ""] })}
        >
          항목 추가
        </Button>
      )}
    </div>
  );
}

export function InterestsForm({ value, onChange }: F<"interests">) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">
        아이콘은 lucide 아이콘 이름(예: brain, eye, message-square). 비우면 점으로 표시돼요.
      </p>
      {value.map((it, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            value={it.label}
            placeholder="컴퓨터 비전"
            onChange={(e) =>
              onChange(value.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
            }
          />
          <Input
            value={it.icon}
            placeholder="eye"
            onChange={(e) =>
              onChange(value.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            삭제
          </Button>
        </div>
      ))}
      {value.length < 12 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, { label: "", icon: "" }])}
        >
          추가
        </Button>
      )}
    </div>
  );
}

export function StackForm({ value, onChange }: F<"stack">) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">
        key는 simple-icons slug(예: python, pytorch, nextdotjs). 라벨은 표시용.
      </p>
      {value.map((it, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            value={it.key}
            placeholder="pytorch"
            onChange={(e) =>
              onChange(value.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))
            }
          />
          <Input
            value={it.label}
            placeholder="PyTorch"
            onChange={(e) =>
              onChange(value.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            삭제
          </Button>
        </div>
      ))}
      {value.length < 24 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, { key: "", label: "" }])}
        >
          추가
        </Button>
      )}
    </div>
  );
}
