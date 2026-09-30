import type { MetadataRoute } from "next";
import { getCanonicalOrigin, isProduction } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  // 프리뷰·로컬은 전체 차단 (plan.md §10)
  if (!isProduction()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/auth/"] },
    sitemap: `${getCanonicalOrigin()}/sitemap.xml`,
  };
}
