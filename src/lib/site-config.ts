export type NavItem = { href: string; label: string; enabled?: boolean };

export const siteConfig = {
  name: "이길현",
  nameEn: "Gilhyeon Lee",
  domain: "gilhyeon.com",
  url: "https://gilhyeon.com",
  description:
    "인공지능학과 학부생 이길현의 개인 사이트. 배우고 만든 것을 기록하는 블로그와 프로젝트, 방명록.",
  email: "rlfgus1018@korea.ac.kr",
  github: "https://github.com/rlfgus1018",
  githubHandle: "rlfgus1018",
  locale: "ko_KR",
  nav: [
    { href: "/about", label: "소개" },
    { href: "/blog", label: "블로그" },
    { href: "/projects", label: "프로젝트" },
    { href: "/guestbook", label: "방명록" },
  ] as NavItem[],
  /** 푸터 하단 법적 고지 링크 (Google OAuth 앱 게시 요건: 공개 개인정보처리방침·약관) */
  legalLinks: [
    { href: "/privacy", label: "개인정보처리방침" },
    { href: "/terms", label: "서비스 약관" },
  ] as NavItem[],
  /** DB(site_content)를 읽을 수 없을 때 쓰는 기본 문구 (plan.md §3.1 장애 시) */
  fallback: {
    heroGreeting: "사람과 기계가 배우는 방식을 함께 공부합니다",
    heroIntro: [
      "인공지능학과에서 공부하는 학부생입니다.",
      "배운 것과 만든 것을 이곳에 차곡차곡 기록합니다.",
    ],
  },
};

export function isNavEnabled(item: NavItem) {
  return item.enabled !== false;
}
