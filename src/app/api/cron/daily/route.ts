import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron (Hobby: 1일 1회, ±59분, best effort). Authorization: Bearer <CRON_SECRET> 로 검증.
 * 역할: keepalive 읽기 + maintenance_daily() (멱등). 주간 백업은 P6에서 추가.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = createAdminSupabase();
  if (!admin)
    return NextResponse.json({ ok: false, error: "SUPABASE_NOT_CONFIGURED" }, { status: 503 });

  const keepalive = await admin.from("post_views").select("slug").limit(1);
  const maintenance = await admin.rpc("maintenance_daily");

  const ok = !keepalive.error && !maintenance.error;
  return NextResponse.json(
    {
      ok,
      keepalive: keepalive.error ? keepalive.error.message : "ok",
      maintenance: maintenance.error ? maintenance.error.message : maintenance.data,
      ran_at: new Date().toISOString(),
    },
    { status: ok ? 200 : 500, headers: { "Cache-Control": "no-store" } },
  );
}
