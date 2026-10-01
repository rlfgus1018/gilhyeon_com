"use client";

import { useState, useTransition } from "react";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshAllCaches } from "@/app/admin/(gated)/site/actions";

/** 대시보드에서 직접 DB를 바꾼 뒤 ISR 캐시를 즉시 만료시킬 때 사용 */
export function RefreshCachesButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await refreshAllCaches();
            setMsg(r.ok ? "공개 페이지 캐시를 새로고침했어요." : r.message);
          })
        }
      >
        <RefreshCwIcon aria-hidden className={pending ? "animate-spin" : ""} /> 캐시 새로고침
      </Button>
      {msg && (
        <span role="status" className="text-muted-foreground text-xs">
          {msg}
        </span>
      )}
    </div>
  );
}
