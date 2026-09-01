import type { Metadata } from 'next';
import LegalDocumentPage from '@/packages/components/base/LegalDocumentPage';
import { generateDefaultMetadata } from '@/packages/utils/metadata';

export const metadata: Metadata = generateDefaultMetadata(
  '개인정보처리방침',
  '꼬순내 서비스 운영 과정에서 수집되는 개인정보의 항목, 이용 목적, 보관 기간과 이용자 권리를 안내합니다.',
  'https://www.kkosunnae.com/privacy',
  {
    includeCanonical: true,
  },
);

const sections = [
  {
    title: '1. 총칙',
    body: [
      '꼬순내는 유기동물 입양 공고 조회와 AI 검색 제공을 위해 필요한 범위에서만 개인정보를 처리합니다.',
      '본 방침은 꼬순내 웹사이트와 그에 부속하는 서비스 전반에 적용되며, 관련 법령 또는 서비스 변경에 따라 수정될 수 있습니다.',
    ],
  },
  {
    title: '2. 수집하는 개인정보 항목',
    body: [
      '회원가입 및 로그인 시 이메일 주소, 비밀번호 또는 소셜 로그인 제공자가 전달하는 식별 정보, 프로필 사진, 닉네임을 수집할 수 있습니다.',
      '회원 프로필 등록 시 닉네임과 한 줄 소개가 저장될 수 있습니다.',
      '서비스 이용 과정에서 접속 로그, 기기 및 브라우저 정보, 방문 페이지, 이용 시간, 쿠키, 대략적 위치 정보 또는 사용자가 허용한 위치 정보가 자동으로 수집될 수 있습니다.',
    ],
  },
  {
    title: '3. 개인정보의 이용 목적',
    body: [
      '회원 식별, 로그인 상태 유지, 신규 회원 등록, 부정 이용 방지에 이용합니다.',
      '입양 공고 추천, 주변 보호소 표시, 사용자 맞춤 지역 노출 등 서비스 핵심 기능 제공에 이용합니다.',
      '동물 찜, 서비스 품질 개선, 이용 통계 분석, 고객 문의 대응에 이용합니다.',
      'Google Analytics, 광고 스크립트 등 연동 도구를 통해 트래픽 분석 및 광고 성과 측정에 활용할 수 있습니다.',
    ],
  },
  {
    title: '4. 보유 및 이용 기간',
    body: [
      '회원정보는 회원 탈퇴 시까지 보관하는 것을 원칙으로 합니다.',
      '관계 법령에 따라 보관이 필요한 경우 해당 법정 기간 동안 별도 보관할 수 있습니다.',
    ],
  },
  {
    title: '5. 제3자 제공 및 처리 위탁',
    body: [
      '꼬순내는 원칙적으로 이용자의 개인정보를 외부에 판매하거나 법적 근거 없이 제3자에게 제공하지 않습니다.',
      '서비스 운영을 위해 Supabase Authentication, Supabase Database, Google Analytics, Google AdSense 등 외부 서비스를 사용할 수 있으며, 이 과정에서 필요한 범위의 데이터가 각 서비스 사업자에게 처리 위탁 또는 전송될 수 있습니다.',
    ],
  },
  {
    title: '6. 쿠키 및 위치정보 사용',
    body: [
      '서비스는 지역 맞춤 목록 제공을 위해 쿠키, 브라우저 저장소(localStorage), 위치 기반 식별값을 사용할 수 있습니다.',
      '위치 정보 접근은 사용자의 브라우저 권한 허용이 있는 경우에만 활용하며, 거부하더라도 기본 지역 기준 서비스는 계속 이용할 수 있습니다.',
      '이용자는 브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있으나, 일부 개인화 기능이 제한될 수 있습니다.',
    ],
  },
  {
    title: '7. 이용자 권리와 행사 방법',
    body: [
      '이용자는 언제든지 본인의 개인정보 열람, 정정, 삭제, 처리정지, 동의 철회를 요청할 수 있습니다.',
      '회원 정보 수정은 서비스 내 프로필 또는 계정 기능을 통해 처리할 수 있으며, 별도 요청은 아래 문의처를 통해 접수할 수 있습니다.',
    ],
  },
  {
    title: '8. 안전성 확보 조치',
    body: [
      '꼬순내는 접근 권한 관리, 인증 체계 운영, 전송 구간 보호, 최소 권한 원칙 적용 등 합리적인 보호 조치를 시행합니다.',
      '다만 인터넷 환경의 특성상 완전한 보안을 보장할 수 없으므로, 이용자도 비밀번호 관리 등 기본 보안 수칙을 준수해야 합니다.',
    ],
  },
  {
    title: '9. 아동의 개인정보',
    body: [
      '꼬순내는 원칙적으로 법정대리인의 동의가 필요한 연령대의 아동을 대상으로 회원가입을 유도하지 않습니다.',
      '관련 사실이 확인될 경우 해당 정보는 확인 후 지체 없이 삭제 또는 필요한 조치를 취할 수 있습니다.',
    ],
  },
  {
    title: '10. 문의처 및 방침 변경',
    body: [
      '개인정보 관련 문의는 이메일 `kkosunnaekr1@gmail.com`으로 접수할 수 있습니다.',
      '본 방침이 변경되는 경우 서비스 내 공지 또는 본 페이지를 통해 시행일과 함께 안내합니다.',
    ],
  },
] satisfies {
  title: string;
  body: string[];
}[];

const englishSections = [
  { title: '1. Overview', body: ['Kkosunnae processes personal information only as necessary to provide shelter-animal listings and AI search.', 'This Policy applies to the Kkosunnae website and related services and may be updated following changes in law or the service.'] },
  { title: '2. Information we collect', body: ['During registration or sign-in, we may collect an email address, authentication identifiers supplied by a social provider, profile image, and nickname.', 'A nickname and short introduction may be stored when a member completes a profile.', 'Access logs, device and browser information, visited pages, usage time, cookies, approximate location, or location authorized by the user may be collected automatically.'] },
  { title: '3. How we use information', body: ['We use information to identify members, maintain sessions, register new members, and prevent abuse.', 'We use it to provide core features such as adoption recommendations, nearby shelters, and regional results.', 'We also use it for saved animals, service improvement, usage analytics, and customer support.', 'Integrated tools such as Google Analytics and advertising scripts may be used to analyze traffic and measure advertising performance.'] },
  { title: '4. Retention', body: ['Member information is generally retained until account deletion.', 'Where retention is legally required, information may be stored separately for the applicable statutory period.'] },
  { title: '5. Third parties and processors', body: ['Kkosunnae does not sell personal information or disclose it to third parties without a lawful basis.', 'We may use services such as Supabase Authentication, Supabase Database, Google Analytics, and Google AdSense. Necessary data may be processed by or transferred to those providers.'] },
  { title: '6. Cookies and location', body: ['The service may use cookies, browser storage such as localStorage, and location identifiers to provide regional results.', 'Location is used only when permitted by the browser. The default regional service remains available if permission is denied.', 'Users may block or delete cookies in browser settings, although some personalized features may be limited.'] },
  { title: '7. Your rights', body: ['Users may request access, correction, deletion, suspension of processing, or withdrawal of consent.', 'Profile and account features may be used to update member information, and other requests may be submitted using the contact details below.'] },
  { title: '8. Security', body: ['Kkosunnae applies reasonable safeguards including access controls, authentication, transport protection, and least-privilege access.', 'No internet service can guarantee complete security, so users should also follow basic security practices.'] },
  { title: '9. Children', body: ['Kkosunnae does not intentionally encourage registration by children who require consent from a legal guardian.', 'If such information is identified, it may be promptly deleted or otherwise handled as required.'] },
  { title: '10. Contact and changes', body: ['Privacy questions may be sent to `kkosunnaekr1@gmail.com`.', 'Material changes to this Policy will be announced through the service or on this page with their effective date.'] },
];

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      badge="Privacy Policy"
      title="개인정보처리방침"
      description="꼬순내 서비스 운영 과정에서 어떤 정보가 왜 수집되고, 어떻게 보관·이용되는지 안내합니다."
      effectiveDate="2026년 4월 27일"
      sections={sections}
      english={{
        title: 'Privacy Policy',
        description: 'Learn what information Kkosunnae collects, why it is used, and how it is stored and protected.',
        effectiveDate: 'April 27, 2026',
        sections: englishSections,
      }}
    />
  );
}
