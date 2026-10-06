import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "서비스 약관",
  description: `${siteConfig.domain} 이용 규칙과 방명록 운영 기준.`,
  alternates: { canonical: "/terms" },
};

const EFFECTIVE = "2026-10-06";

export default function TermsPage() {
  return (
    <LegalPage
      title="서비스 약관"
      lead={`${siteConfig.domain}(이하 "사이트")을 이용할 때 적용되는 규칙입니다. 사이트는 ${siteConfig.name}이 운영하는 개인 사이트이며, 방명록에 글을 남기려면 아래 내용에 동의해야 합니다.`}
      effectiveDate={EFFECTIVE}
    >
      <LegalSection title="1. 서비스 내용">
        <p>
          사이트는 운영자가 쓴 블로그 글과 프로젝트 소개, 그리고 방문자가 한마디를 남길 수 있는
          방명록을 제공합니다. 모든 기능은 무료이며 영리 목적이 없습니다.
        </p>
      </LegalSection>

      <LegalSection title="2. 계정과 로그인">
        <ul>
          <li>
            방명록 작성에만 로그인이 필요하며, GitHub 또는 Google 계정으로 로그인합니다. 사이트는
            별도의 비밀번호를 만들거나 보관하지 않습니다.
          </li>
          <li>로그인한 계정의 이름과 프로필 사진은 방명록 카드에 공개 표시됩니다.</li>
          <li>
            계정 정보 처리는 <Link href="/privacy">개인정보처리방침</Link>을 따릅니다.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. 방명록 이용 규칙">
        <p>방명록에는 다음 제한이 자동으로 적용됩니다.</p>
        <ul>
          <li>한 글은 1자 이상 280자 이하이며, 링크(URL·도메인)는 넣을 수 없습니다.</li>
          <li>계정당 1분에 1개, 하루에 5개까지 쓸 수 있습니다.</li>
          <li>욕설·비하 표현은 자동 필터로 거부될 수 있습니다.</li>
        </ul>
        <p>다음과 같은 글은 운영자가 예고 없이 숨기거나 삭제할 수 있습니다.</p>
        <ul>
          <li>타인을 비방·차별·위협하거나 개인정보를 노출하는 글</li>
          <li>광고·홍보·스팸, 반복 게시</li>
          <li>법령이나 공서양속에 어긋나는 글</li>
        </ul>
        <p>
          반복되거나 심각한 경우 해당 계정의 방명록 이용을 차단할 수 있습니다. 차단된 계정은 글을
          남길 수 없으며, 기존 글은 모두 숨김 처리됩니다.
        </p>
      </LegalSection>

      <LegalSection title="4. 저작권">
        <ul>
          <li>
            블로그 글·프로젝트 소개·이미지 등 운영자가 만든 콘텐츠의 저작권은 운영자에게 있습니다.
            출처(링크)를 밝히면 일부를 인용할 수 있으며, 전문 복제·재배포는 사전 동의가 필요합니다.
          </li>
          <li>
            방명록 글의 저작권은 작성자에게 있습니다. 작성자는 사이트가 해당 글을 사이트 안에서
            표시·보관하는 것을 허락합니다. 작성자는 언제든 본인 글을 삭제할 수 있습니다.
          </li>
          <li>글 본문의 소스 코드는 별도 표시가 없으면 자유롭게 사용할 수 있습니다.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. 서비스 변경·중단과 책임">
        <ul>
          <li>
            사이트는 개인이 운영하는 무료 서비스로, 사전 고지 없이 기능이 바뀌거나 일시 중단·종료될
            수 있습니다.
          </li>
          <li>
            운영자는 사이트의 글이 정확하거나 특정 목적에 맞는다고 보증하지 않으며, 글을 참고해 내린
            판단의 결과에 책임지지 않습니다.
          </li>
          <li>방명록 글의 내용에 대한 책임은 작성자에게 있습니다.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. 약관 변경">
        <p>
          약관이 바뀌면 이 페이지에 시행일과 함께 게시합니다. 중요한 변경은 시행 7일 전에 사이트
          홈에 알립니다. 변경 후 사이트를 계속 이용하면 바뀐 약관에 동의한 것으로 봅니다.
        </p>
      </LegalSection>

      <LegalSection title="7. 준거법과 문의">
        <p>
          이 약관은 대한민국 법을 따릅니다. 문의는{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>로 보내 주세요.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
