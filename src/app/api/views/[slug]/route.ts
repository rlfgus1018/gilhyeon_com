import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createPublicSupabase } from "@/lib/supabase/public";
import { clientIp, visitorHash } from "@/lib/views/visitor-hash";

export const dynamic = "force-dynamic";
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** GET: 현재 조회수 (anon 읽기, 60초 캐시) */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/views/[slug]">) {
  const { slug } = await ctx.params;
  if (!SLUG_RE.test(slug) || slug.length > 80)
    return NextResponse.json({ error: "INVALID_SLUG" }, { status: 400 });
  const sb = createPublicSupabase();
  if (!sb) return NextResponse.json({ error: "UNAVAILABLE" }, { status: 503 });
  const { data, error } = await sb
    .from("post_views")
    .select("count")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "DB" }, { status: 500 });
  return NextResponse.json(
    { count: Number(data?.count ?? 0) },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

/**
 * POST: 열람 기록. 공개 글 존재·분당 30회·일 1회 dedupe는 DB 함수(record_view, service_role 전용)가 결정한다.
 * 조회수는 "중복을 일부 줄인 참고용 열람 횟수"다.
 */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/views/[slug]">) {
  const { slug } = await ctx.params;
  if (!SLUG_RE.test(slug) || slug.length > 80)
    return NextResponse.json({ error: "INVALID_SLUG" }, { status: 400 });
  const admin = createAdminSupabase();
  if (!admin) return NextResponse.json({ error: "UNAVAILABLE" }, { status: 503 });

  const hash = visitorHash(clientIp(req.headers), req.headers.get("user-agent") ?? "");
  const { data, error } = await admin.rpc("record_view", { p_slug: slug, p_visitor_hash: hash });
  if (error) {
    if (/UNKNOWN_SLUG/.test(error.message))
      return NextResponse.json(
        { error: "NOT_FOUND" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    return NextResponse.json(
      { error: "DB" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
  const row = (Array.isArray(data) ? data[0] : data) as
    { count: number; counted: boolean } | undefined;
  return NextResponse.json(
    { count: Number(row?.count ?? 0), counted: Boolean(row?.counted) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
