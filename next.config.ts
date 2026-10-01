import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://aapxlwcxikkzmdneyxlw.supabase.co").hostname;
  } catch {
    return "aapxlwcxikkzmdneyxlw.supabase.co";
  }
})();

const nextConfig: NextConfig = {
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
