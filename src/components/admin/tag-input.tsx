"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  max?: number;
  id?: string;
};

export function TagInput({ value, onChange, suggestions = [], max = 5, id }: Props) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const t = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || value.includes(t) || value.length >= max) return;
    onChange([...value, t]);
    setDraft("");
  };
  const matches = draft
    ? suggestions.filter((s) => s.includes(draft.toLowerCase()) && !value.includes(s)).slice(0, 6)
    : [];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1 pr-1">
            {t}
            <button
              type="button"
              aria-label={`${t} 태그 제거`}
              onClick={() => onChange(value.filter((x) => x !== t))}
              className="hover:bg-foreground/10 rounded-full p-0.5"
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        id={id}
        value={draft}
        placeholder={value.length >= max ? `최대 ${max}개` : "태그 입력 후 Enter"}
        disabled={value.length >= max}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        list={undefined}
      />
      {matches.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {matches.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="bg-muted hover:bg-accent rounded-full px-2 py-0.5 text-xs"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
