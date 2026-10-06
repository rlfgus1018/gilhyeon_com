import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://aapxlwcxikkzmdneyxlw.supabase.co",
    ).hostname;
  } catch {
    return "aapxlwcxikkzmdneyxlw.supabase.co";
  }
})();

// 세션에 따라 달라지는 화면은 브라우저·CDN 어디에도 저장하지 않는다 (plan.md §2.1)
const noStore = [{ key: "Cache-Control", value: "private, no-store" }];

// OG 이미지(next/og)가 런타임에 읽는 Pretendard OTF — 서버 번들 트레이스에 포함시킨다 (src/lib/og/card.tsx)
const ogFonts = ["node_modules/pretendard/dist/public/static/Pretendard-{Regular,Bold}.otf"];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/guestbook", headers: noStore },
      { source: "/admin", headers: noStore },
      { source: "/admin/:path*", headers: noStore },
    ];
  },
  images: {
    // Storage 공개 이미지 + OAuth 아바타 호스트만 최적화 허용 (plan.md §6)
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  outputFileTracingIncludes: {
    "/opengraph-image": ogFonts,
    "/blog/*/opengraph-image": ogFonts,
    "/projects/*/opengraph-image": ogFonts,
  },
};

export default nextConfig;
