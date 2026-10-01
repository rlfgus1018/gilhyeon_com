import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/guard";
import { ProjectEditor } from "@/components/admin/project-editor";

export const metadata: Metadata = { title: "새 프로젝트" };

export default async function NewProjectPage() {
  await requireAdminPage();
  return <ProjectEditor initial={null} thumbnail={null} />;
}
