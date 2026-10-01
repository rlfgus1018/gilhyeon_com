import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { ProjectCard } from "@/components/projects/project-card";
import { getPublishedProjects } from "@/lib/content/projects";

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
    <Container className="space-y-10 py-16">
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">프로젝트</h1>
        <p className="text-muted-foreground mt-2">만들어 본 것들. AI/ML이 많아요.</p>
      </header>
      {!r.ok ? (
        <p className="text-muted-foreground card-surface p-8 text-center text-sm">
          프로젝트를 잠시 불러올 수 없어요.
        </p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground card-surface p-8 text-center text-sm">
          프로젝트를 정리하고 있어요.
        </p>
      ) : (
        TYPES.map((t) => {
          const group = items.filter((p) => p.type === t.key);
          if (group.length === 0) return null;
          return (
            <section key={t.key} aria-labelledby={`type-${t.key}`}>
              <h2 id={`type-${t.key}`} className="mb-4 text-xl font-semibold">
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
