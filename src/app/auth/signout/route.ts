import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { resolveNextPath } from "@/lib/auth/next-path";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  const form = await request.formData().catch(() => null);
  const next = resolveNextPath(form?.get("next")?.toString());
  const res = NextResponse.redirect(new URL(next, request.nextUrl.origin), { status: 303 });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
