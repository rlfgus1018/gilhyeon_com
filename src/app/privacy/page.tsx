import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${siteConfig.domain}이 어떤 정보를 어떻게 다루는지 설명합니다.`,
  alternates: { canonical: "/privacy" },
};

const EFFECTIVE = "2026-10-06";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="개인정보처리방침"
      lead={`${siteConfig.name}(이하 "운영자")은 ${siteConfig.domain}(이하 "사이트")을 운영하며, 사이트가 수집하는 정보와 쓰임을 아래와 같이 알립니다.`}
      effectiveDate={EFFECTIVE}
    >
      <LegalSection title="1. 수집하는 정보와 목적">
        <p>
          사이트는 글을 읽기만 할 때는 계정 정보를 수집하지 않습니다. 정보는 다음 경우에만
          처리합니다.
        </p>
        <table>
          <thead>
            <tr>
              <th>상황</th>
              <th>항목</th>
              <th>목적</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>방명록 로그인(GitHub·Google)</td>
              <td>공급자 계정의 고유 ID, 이름(표시명), 프로필 사진 주소, 이메일 주소</td>
              <td>로그인 상태 유지, 작성자 표시, 작성 제한·차단 적용</td>
            </tr>
            <tr>
              <td>방명록 작성</td>
              <td>글 내용, 색상, 작성 시각, 작성 당시의 이름·프로필 사진</td>
              <td>방명록 공개 표시</td>
            </tr>
            <tr>
              <td>블로그 글 열람</td>
              <td>
                IP 주소와 브라우저 정보를 그날의 비밀 값과 함께 해시한 값(원본은 저장하지 않음)
              </td>
              <td>글 조회수를 하루 1회만 세기 위한 중복 확인</td>
            </tr>
          </tbody>
        </table>
        <p>
          이메일 주소는 로그인 서비스가 계정을 구분하는 데만 쓰이며 사이트 어디에도 표시되지
          않습니다. 이름과 프로필 사진은 방명록 카드에 공개됩니다.
        </p>
      </LegalSection>

      <LegalSection title="2. 쿠키와 브라우저 저장소">
        <ul>
          <li>
            <strong>로그인 세션 쿠키</strong>: 로그인하면 인증 서비스(Supabase)가 세션 쿠키를
            둡니다. 로그아웃하거나 만료되면 사라집니다.
          </li>
          <li>
            <strong>돌아갈 위치 쿠키</strong>: 로그인을 시작한 페이지로 되돌아가기 위해 짧게 쓰는
            쿠키입니다. 로그인이 끝나면 지웁니다.
          </li>
          <li>
            <strong>테마 설정</strong>: 라이트/다크 선택은 브라우저의 로컬 저장소에만 남고 서버로
            보내지 않습니다.
          </li>
        </ul>
        <p>광고 쿠키나 외부 분석(추적) 도구는 사용하지 않습니다.</p>
      </LegalSection>

      <LegalSection title="3. 보관 기간">
        <ul>
          <li>계정 정보와 방명록 글: 작성자가 글을 지우거나 계정 삭제를 요청할 때까지</li>
          <li>조회수 중복 확인용 해시: 2일</li>
          <li>작성 제한(1분 1개·하루 5개) 확인용 작성 시각 기록: 30일</li>
          <li>이용 차단 기록(계정 ID, 사유, 시각): 차단을 해제할 때까지</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. 처리 위탁과 제3자">
        <p>사이트는 다음 서비스를 이용하며, 각 서비스는 자체 개인정보처리방침을 따릅니다.</p>
        <ul>
          <li>
            <strong>Supabase</strong>(데이터베이스·인증, 서울 리전): 계정 정보와 방명록 글 보관
          </li>
          <li>
            <strong>Vercel</strong>(호스팅): 페이지 제공. 서버 접속 로그에 IP 주소가 짧은 기간 남을
            수 있습니다.
          </li>
          <li>
            <strong>GitHub·Google</strong>(로그인): 로그인 시 각 서비스의 동의 화면을 거치며,
            사이트는 이름·프로필 사진·이메일만 받습니다.
          </li>
          <li>
            <strong>YouTube</strong>: 영상이 들어간 글을 열면 YouTube가 자체 쿠키를 둘 수 있습니다.
          </li>
        </ul>
        <p>
          위 외에 개인정보를 제3자에게 제공하거나 판매하지 않습니다. 법령에 따른 요청이 있을 때만
          예외입니다.
        </p>
      </LegalSection>

      <LegalSection title="5. 이용자의 권리">
        <ul>
          <li>본인이 쓴 방명록 글은 카드 메뉴에서 바로 삭제할 수 있습니다.</li>
          <li>
            계정 삭제, 보관된 정보의 열람·정정은{" "}
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>로 요청하면 10일 안에
            처리합니다. 계정을 삭제하면 방명록 글도 함께 삭제됩니다.
          </li>
          <li>
            GitHub·Google 계정 설정에서 사이트 연결을 해제하면 이후 로그인이 되지 않습니다. 이미
            저장된 정보의 삭제는 위 이메일로 요청해 주세요.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. 안전조치">
        <p>
          모든 통신은 HTTPS로 암호화됩니다. 데이터베이스는 행 단위 접근 제어로 본인 글과 공개 글만
          읽을 수 있게 하고, 관리 권한이 필요한 작업은 운영자 계정에서만 가능합니다. 조회수 확인용
          해시는 날마다 바뀌는 비밀 값을 섞어 날짜 간 추적이 불가능합니다.
        </p>
      </LegalSection>

      <LegalSection title="7. 아동의 개인정보">
        <p>
          사이트는 만 14세 미만 아동의 정보를 의도적으로 수집하지 않습니다. 아동의 정보가 수집된
          사실을 알게 되면 지체 없이 삭제합니다.
        </p>
      </LegalSection>

      <LegalSection title="8. 책임자와 방침 변경">
        <p>
          개인정보 보호책임자: {siteConfig.name} (
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>)
        </p>
        <p>
          방침이 바뀌면 이 페이지에 시행일과 함께 게시합니다. 이용 규칙은{" "}
          <Link href="/terms">서비스 약관</Link>을 참고해 주세요.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
