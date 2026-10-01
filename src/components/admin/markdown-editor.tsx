"use client";

import { useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import {
  BoldIcon,
  CodeIcon,
  HeadingIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  MessageSquareWarningIcon,
  SigmaIcon,
  PlayIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type EditorInsert = {
  before: string;
  after?: string;
  placeholder?: string;
  block?: boolean;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onPickImage?: () => void;
  minHeight?: string;
};

/** 선택 영역을 감싸거나 커서 위치에 삽입한다. */
function applyInsert(view: EditorView, ins: EditorInsert) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to) || ins.placeholder || "";
  let text = `${ins.before}${selected}${ins.after ?? ""}`;
  if (ins.block) {
    const lineStart = view.state.doc.lineAt(from).from === from;
    text = `${lineStart ? "" : "\n\n"}${text}\n\n`;
  }
  view.dispatch({
    changes: { from, to, insert: text },
    selection: {
      anchor:
        from + ins.before.length + (ins.block && view.state.doc.lineAt(from).from !== from ? 2 : 0),
      head:
        from +
        ins.before.length +
        selected.length +
        (ins.block && view.state.doc.lineAt(from).from !== from ? 2 : 0),
    },
  });
  view.focus();
}

const TOOLS: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  insert: EditorInsert;
}[] = [
  {
    label: "굵게",
    icon: BoldIcon,
    insert: { before: "**", after: "**", placeholder: "굵은 글씨" },
  },
  { label: "기울임", icon: ItalicIcon, insert: { before: "_", after: "_", placeholder: "기울임" } },
  {
    label: "소제목",
    icon: HeadingIcon,
    insert: { before: "## ", placeholder: "소제목", block: true },
  },
  {
    label: "링크",
    icon: LinkIcon,
    insert: { before: "[", after: "](https://)", placeholder: "링크 텍스트" },
  },
  { label: "목록", icon: ListIcon, insert: { before: "- ", placeholder: "항목", block: true } },
  {
    label: "코드 블록",
    icon: CodeIcon,
    insert: {
      before: '```python title="example.py"\n',
      after: "\n```",
      placeholder: "print('hello')",
      block: true,
    },
  },
  {
    label: "수식",
    icon: SigmaIcon,
    insert: { before: "$$\n", after: "\n$$", placeholder: "E = mc^2", block: true },
  },
  {
    label: "콜아웃",
    icon: MessageSquareWarningIcon,
    insert: {
      before: ':::callout{type="info" title="참고"}\n',
      after: "\n:::",
      placeholder: "내용",
      block: true,
    },
  },
  {
    label: "YouTube",
    icon: PlayIcon,
    insert: { before: '::youtube{id="', after: '"}', placeholder: "영상ID", block: true },
  },
];

export function MarkdownEditor({ value, onChange, onPickImage, minHeight = "60vh" }: Props) {
  const ref = useRef<ReactCodeMirrorRef>(null);
  const { resolvedTheme } = useTheme();

  const insert = useCallback((ins: EditorInsert) => {
    const view = ref.current?.view;
    if (view) applyInsert(view, ins);
  }, []);

  return (
    <div className="bg-card overflow-hidden rounded-2xl border">
      <div
        role="toolbar"
        aria-label="서식"
        className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5"
      >
        {TOOLS.map((t) => (
          <Tooltip key={t.label}>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t.label}
                  onClick={() => insert(t.insert)}
                />
              }
            >
              <t.icon className="size-4" />
            </TooltipTrigger>
            <TooltipContent>{t.label}</TooltipContent>
          </Tooltip>
        ))}
        {onPickImage && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="이미지 삽입"
                  onClick={onPickImage}
                />
              }
            >
              <ImageIcon className="size-4" />
            </TooltipTrigger>
            <TooltipContent>이미지 삽입</TooltipContent>
          </Tooltip>
        )}
      </div>
      <CodeMirror
        ref={ref}
        value={value}
        onChange={onChange}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        minHeight={minHeight}
        basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: false }}
        extensions={[markdown({ base: markdownLanguage }), EditorView.lineWrapping]}
        className="text-[15px] [&_.cm-editor]:bg-transparent [&_.cm-editor]:outline-none [&_.cm-scroller]:font-mono [&_.cm-scroller]:leading-relaxed"
        aria-label="본문 Markdown"
      />
    </div>
  );
}

/** 외부(이미지 피커 등)에서 에디터에 텍스트를 넣을 때 쓰는 헬퍼 타입 */
export type MarkdownEditorHandle = { insert: (ins: EditorInsert) => void };
