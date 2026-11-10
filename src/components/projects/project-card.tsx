import Link from "next/link";
import Image from "next/image";
import { ExternalLinkIcon, FileTextIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GitHubIcon } from "@/components/icons";
import type { ProjectSummary } from "@/lib/content/projects";

const WORK = { done: null, wip: "진행 중", archived: "보관" } as const;

/** 유형(AI, Web, 기타)은 목록의 묶음 제목으로 보여주고, 카드 색은 프로젝트 색으로 통일한다. */
export function ProjectCard({ project: p }: { project: ProjectSummary }) {
  const title = p.has_body ? (
    <Link href={`/projects/${p.slug}`} className="hover:underline">
      {p.title}
    </Link>
  ) : (
    p.title
  );
  const hasThumbnail = Boolean(p.thumbnail?.url);
  const status = WORK[p.work_status];
  return (
    <article data-accent="mint" className="card-surface flex flex-col overflow-hidden">
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
        <div className="bg-tone text-on-tone flex aspect-[3/1] items-end p-5">
          <h3 className="text-item font-bold">{title}</h3>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {(hasThumbnail || status) && (
          <div className="flex items-start justify-between gap-2">
            {hasThumbnail && <h3 className="text-item font-semibold">{title}</h3>}
            {status && <Badge variant="outline">{status}</Badge>}
          </div>
        )}
        <p className="text-muted-foreground text-body flex-1">{p.summary}</p>
        {p.tech.length > 0 && <p className="text-muted-foreground text-aux">{p.tech.join(", ")}</p>}
        <div className="text-aux flex flex-wrap gap-3">
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
            <Link href={`/projects/${p.slug}`} className="text-tone-ink ml-auto hover:underline">
              자세히
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
