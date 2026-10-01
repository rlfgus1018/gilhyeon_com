import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/guard";
import { SiteEditor } from "@/components/admin/site-editor";
import { getSiteContent } from "@/lib/content/site";

export const metadata: Metadata = { title: "사이트 콘텐츠" };

export default async function AdminSitePage() {
  await requireAdminPage();
  const site = await getSiteContent();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">사이트</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          홈과 소개 페이지의 문구·사진·연혁을 편집합니다. 저장하면 바로 반영돼요.
        </p>
      </header>
      {!site.ok && (
        <p className="border-amber bg-amber-soft rounded-xl border px-4 py-2 text-sm">
          현재 값을 불러오지 못해 기본값을 보여줘요. 저장하면 덮어씁니다.
        </p>
      )}
      <SiteEditor initial={site.data} media={Object.fromEntries(site.media)} />
    </div>
  );
}
