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
};

export default nextConfig;
