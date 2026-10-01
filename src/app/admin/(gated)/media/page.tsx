import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/guard";
import { MediaGrid } from "@/components/admin/media-grid";
import type { MediaRow } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "미디어" };

export default async function AdminMediaPage() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">미디어</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          업로드한 이미지를 관리합니다. 본문·커버에서 쓰는 이미지는 삭제 전에 경고해요.
        </p>
      </header>
      {error ? (
        <p role="alert" className="border-coral bg-coral-soft rounded-xl border px-4 py-3 text-sm">
          {error.message}
        </p>
      ) : (
        <MediaGrid initial={(data ?? []) as MediaRow[]} />
      )}
    </div>
  );
}
