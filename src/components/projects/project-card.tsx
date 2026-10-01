import Link from "next/link";
import Image from "next/image";
import { ExternalLinkIcon, FileTextIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GitHubIcon } from "@/components/icons";
import type { ProjectSummary } from "@/lib/content/projects";

const WORK = { done: null, wip: "진행 중", archived: "보관" } as const;
const ACCENT = { ai: "brand", web: "sky", other: "amber" } as const;

export function ProjectCard({ project: p }: { project: ProjectSummary }) {
  const title = p.has_body ? (
    <Link href={`/projects/${p.slug}`} className="hover:underline">
      {p.title}
    </Link>
  ) : (
    p.title
  );
  return (
    <article
      data-accent={ACCENT[p.type]}
      className="card-surface card-surface-hover flex flex-col overflow-hidden"
    >
      {p.thumbnail?.url ? (
        <div className="bg-muted relative aspect-video">
          <Image
            src={p.thumbnail.url}
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div aria-hidden className="bg-tone-soft relative aspect-video">
          <span className="bg-tone/40 absolute right-6 bottom-6 size-12 rounded-2xl" />
          <span className="bg-card absolute top-6 left-6 size-8 rounded-full border" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {WORK[p.work_status] && <Badge variant="outline">{WORK[p.work_status]}</Badge>}
        </div>
        <p className="text-muted-foreground flex-1 text-sm">{p.summary}</p>
        <div className="flex flex-wrap gap-1.5">
          {p.tech.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {p.links.github && (
            <a
              href={p.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              <GitHubIcon className="size-3.5" />
              GitHub
            </a>
          )}
          {p.links.demo && (
            <a
              href={p.links.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              <ExternalLinkIcon className="size-3.5" aria-hidden />
              Demo
            </a>
          )}
          {p.links.post && (
            <Link href={p.links.post} className="inline-flex items-center gap-1 hover:underline">
              <FileTextIcon className="size-3.5" aria-hidden />글
            </Link>
          )}
          {p.has_body && (
            <Link href={`/projects/${p.slug}`} className="text-tone ml-auto hover:underline">
              자세히
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
