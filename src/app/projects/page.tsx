import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectCard } from "@/components/projects/project-card";
import { getPublishedProjects } from "@/lib/content/projects";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "프로젝트",
  description: "만들어 본 것들.",
  alternates: { canonical: "/projects" },
};

const TYPES = [
  { key: "ai", label: "AI / ML" },
  { key: "web", label: "Web" },
  { key: "other", label: "기타" },
] as const;

export default async function ProjectsPage() {
  const r = await getPublishedProjects();
  const items = r.ok ? r.data : [];
  return (
    <Container className="space-y-10 py-12 sm:py-16">
      <PageHeader accent="mint" title="프로젝트" lead="만들어 본 것들. AI/ML이 많아요." />
      {!r.ok ? (
        <p className="text-muted-foreground text-body">프로젝트를 잠시 불러올 수 없어요.</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-body">
          아직 공개한 프로젝트가 없어요.{" "}
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2"
          >
            GitHub에서 작업물 보기
          </a>
        </p>
      ) : (
        TYPES.map((t) => {
          const group = items.filter((p) => p.type === t.key);
          if (group.length === 0) return null;
          return (
            <section key={t.key} aria-labelledby={`type-${t.key}`}>
              <h2 id={`type-${t.key}`} className="text-section mb-5 font-bold">
                {t.label}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {group.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </Container>
  );
}
