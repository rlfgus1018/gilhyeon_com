import * as icons from "simple-icons";

/** simple-icons slug(예: python, pytorch, nextdotjs) → 서버에서 SVG path 렌더. 없으면 점. */
export function StackIcon({ slug, className }: { slug: string; className?: string }) {
  const key = `si${slug.charAt(0).toUpperCase()}${slug.slice(1)}` as keyof typeof icons;
  const icon = icons[key] as { path: string; title: string } | undefined;
  if (!icon?.path)
    return (
      <span aria-hidden className={`bg-tone inline-block rounded-full ${className ?? "size-3"}`} />
    );
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d={icon.path} />
    </svg>
  );
}
