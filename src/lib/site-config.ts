export type NavItem = { href: string; label: string; enabled?: boolean };
export type FooterLink = NavItem & { external?: boolean };
export type FooterGroup = { title: string; links: FooterLink[] };

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
    { href: "/", label: "홈" },
    { href: "/about", label: "소개" },
    { href: "/blog", label: "블로그" },
    { href: "/projects", label: "프로젝트" },
    { href: "/guestbook", label: "방명록" },
  ] as NavItem[],
  footerGroups: [
    {
      title: "둘러보기",
      links: [
        { href: "/", label: "홈" },
        { href: "/about", label: "소개" },
        { href: "/blog", label: "블로그" },
        { href: "/projects", label: "프로젝트" },
      ],
    },
    {
      title: "더 보기",
      links: [
        { href: "/guestbook", label: "방명록" },
        { href: "/rss.xml", label: "RSS", external: true },
        { href: "/toolbox", label: "Toolbox", enabled: false },
        { href: "/changelog", label: "Changelog", enabled: false },
        { href: "/stats", label: "Stats", enabled: false },
      ],
    },
    {
      title: "연락",
      links: [
        { href: "https://github.com/rlfgus1018", label: "GitHub", external: true },
        { href: "mailto:rlfgus1018@korea.ac.kr", label: "이메일", external: true },
      ],
    },
  ] as FooterGroup[],
  /** 푸터 하단 법적 고지 링크 (Google OAuth 앱 게시 요건: 공개 개인정보처리방침·약관) */
  legalLinks: [
    { href: "/privacy", label: "개인정보처리방침" },
    { href: "/terms", label: "서비스 약관" },
  ] as NavItem[],
  /** DB(site_content)를 읽을 수 없을 때 쓰는 기본 문구 (plan.md §3.1 장애 시) */
  fallback: {
    heroGreeting: "안녕하세요, 이길현입니다 👋",
    heroIntro: [
      "인공지능학과에서 공부하는 학부생입니다.",
      "배운 것과 만든 것을 이곳에 차곡차곡 기록합니다.",
    ],
    footerIntro: "AI를 공부하는 학부생의 작업실. 글과 프로젝트, 그리고 방명록.",
  },
};

export function isNavEnabled(item: NavItem) {
  return item.enabled !== false;
}
