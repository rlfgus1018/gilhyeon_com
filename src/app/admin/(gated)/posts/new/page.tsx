import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/guard";
import { PostEditor } from "@/components/admin/post-editor";
import { loadAllTags } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "새 글" };

export default async function NewPostPage() {
  const { supabase } = await requireAdminPage();
  const allTags = await loadAllTags(supabase);
  return <PostEditor initial={null} allTags={allTags} cover={null} />;
}
