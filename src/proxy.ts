import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/** Next 16 proxy (구 middleware). 세션이 필요한 경로에서만 실행해 정적 페이지는 건드리지 않는다. */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/guestbook/:path*", "/auth/:path*", "/admin/:path*"],
};
