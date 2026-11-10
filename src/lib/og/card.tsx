import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { siteConfig } from "@/lib/site-config";

/**
 * OG 카드(1200×630) 공용 렌더러. next/og(satori)는 flexbox·hex 색상·ttf/otf만 지원한다.
 * 폰트는 node_modules의 Pretendard OTF를 런타임에 읽는다(next.config outputFileTracingIncludes로 트레이스).
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// 경로를 리터럴로 한 번에 적어야 파일 트레이서가 디렉터리 전체(9 가중치, 14MB)가 아닌 두 파일만 포함한다
const FONT_REGULAR = "node_modules/pretendard/dist/public/static/Pretendard-Regular.otf";
const FONT_BOLD = "node_modules/pretendard/dist/public/static/Pretendard-Bold.otf";
let fontsPromise: Promise<{ name: string; data: ArrayBuffer; weight: 400 | 700 }[]> | null = null;

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/** 모듈 싱글턴 — 람다 인스턴스당 1회만 읽는다 */
export function loadOgFonts() {
  fontsPromise ??= Promise.all([
    readFile(join(process.cwd(), FONT_REGULAR)),
    readFile(join(process.cwd(), FONT_BOLD)),
  ]).then(([regular, bold]) => [
    { name: "Pretendard", data: toArrayBuffer(regular), weight: 400 as const },
    { name: "Pretendard", data: toArrayBuffer(bold), weight: 700 as const },
  ]);
  return fontsPromise;
}

// 라이트 팔레트의 hex 환산값 (tokens.css oklch → satori는 hex만). 색면 위 글자 대비는 design-audit.md §5.1
const TONES = {
  brand: { bg: "#555DE3", fg: "#FCFCFC" },
  coral: { bg: "#FA6863", fg: "#18181B" },
  mint: { bg: "#49D3A1", fg: "#18181B" },
};

export type OgCardProps = {
  /** 콘텐츠 종류 색. 기본은 사이트 공통색 */
  tone?: keyof typeof TONES;
  /** 작은 라벨 (예: "블로그", "프로젝트") */
  kicker?: string;
  title: string;
  description?: string | null;
  /** 하단 메타 (태그, 날짜 등) */
  meta?: string[];
  /** 오른쪽에 넣을 이미지(data: URL 또는 절대 URL). 없으면 색 면 */
  imageSrc?: string | null;
};

function clamp(s: string, max: number) {
  const chars = [...s];
  return chars.length > max ? chars.slice(0, max - 1).join("") + "…" : s;
}

export async function renderOgCard(props: OgCardProps) {
  const fonts = await loadOgFonts();
  const title = clamp(props.title, 60);
  const description = props.description ? clamp(props.description, 90) : null;
  const titleSize = [...title].length > 36 ? 52 : 64;
  const withImage = Boolean(props.imageSrc);
  const tone = TONES[props.tone ?? "brand"];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: tone.bg,
        color: tone.fg,
        fontFamily: "Pretendard",
      }}
    >
      {/* 본문 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: withImage ? 760 : 1200,
          padding: "72px 72px 56px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {props.kicker && (
            <div
              style={{
                display: "flex",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {props.kicker}
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: -1,
              wordBreak: "keep-all",
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                lineHeight: 1.45,
                wordBreak: "keep-all",
              }}
            >
              {description}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 26,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: 8,
                background: tone.fg,
                color: tone.bg,
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              길
            </div>
            <span style={{ fontWeight: 700 }}>{siteConfig.name}</span>
            <span>{siteConfig.domain}</span>
          </div>
          {props.meta && props.meta.length > 0 && (
            <div style={{ display: "flex", gap: 16 }}>
              {props.meta.slice(0, 3).map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* 오른쪽 이미지. 없으면 색면만 */}
      {withImage ? (
        <div style={{ display: "flex", width: 440, height: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={props.imageSrc!}
            alt=""
            width={440}
            height={630}
            style={{ objectFit: "cover", width: 440, height: 630 }}
          />
        </div>
      ) : null}
    </div>,
    { ...OG_SIZE, fonts },
  );
}

/**
 * 커버 이미지를 data: URL로 가져온다. 실패하면 null → 이미지 없는 카드로 그린다.
 * (satori가 렌더 중 외부 URL을 못 받으면 전체가 실패하므로 미리 받아서 넘긴다)
 */
export async function fetchImageAsDataUrl(url: string, maxBytes = 4 * 1024 * 1024) {
  try {
    // cache: "no-store" 를 명시하면 라우트가 동적으로 바뀌어 ISR 캐시를 잃는다 — 기본값 그대로 둔다
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    // satori는 data: URL의 webp 크기를 읽지 못해 렌더 전체가 실패한다. png·jpeg·gif만 넘긴다
    if (!/^image\/(png|jpeg|gif)/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > maxBytes) return null;
    return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
