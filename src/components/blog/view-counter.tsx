"use client";

import { useEffect, useState } from "react";
import { EyeIcon } from "lucide-react";

const inflight = new Set<string>();

/**
 * 마운트 시 1회 POST(성공 시 sessionStorage 기록 → 같은 세션 재방문은 GET만).
 * 실패하면 GET으로 표시만 하고 기록하지 않아 다음 방문에 재시도한다. 개발 모드 이중 effect는 inflight로 막는다.
 */
export function ViewCounter({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const key = `viewed:${slug}`;
    let seen = false;
    try {
      seen = sessionStorage.getItem(key) === "1";
    } catch {}
    if (inflight.has(slug)) return;
    inflight.add(slug);
    const url = `/api/views/${slug}`;
    (async () => {
      try {
        const res = await fetch(url, { method: seen ? "GET" : "POST", cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { count: number };
        setCount(json.count);
        if (!seen) {
          try {
            sessionStorage.setItem(key, "1");
          } catch {}
        }
      } catch {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) setCount(((await res.json()) as { count: number }).count);
          else setFailed(true);
        } catch {
          setFailed(true);
        }
      } finally {
        inflight.delete(slug);
      }
    })();
  }, [slug]);

  return (
    <span className="inline-flex items-center gap-1" title="참고용 열람 횟수">
      <EyeIcon className="size-3.5" aria-hidden />
      {failed ? (
        "—"
      ) : count === null ? (
        <span
          className="bg-muted inline-block h-3 w-6 animate-pulse rounded"
          aria-label="조회수 불러오는 중"
        />
      ) : (
        count.toLocaleString("ko-KR")
      )}
    </span>
  );
}
