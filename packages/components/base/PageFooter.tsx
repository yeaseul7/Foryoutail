import Image from 'next/image';
import Link from 'next/link';

const FOOTER_LINKS = {
  둘러보기: [
    { label: '홈', href: '/' },
    { label: '입양 공고', href: '/shelter' },
    { label: '보호소', href: '/animalShelter' },
    { label: 'AI 찾기', href: '/search-animal' },
    { label: '커뮤니티', href: '/community' },
  ],
  서비스: [
    { label: '서비스 소개', href: '/about' },
    { label: '회원가입', href: '/register' },
    { label: '글쓰기', href: '/write' },
  ],
  정책: [
    { label: '개인정보처리방침', href: '/privacy' },
    { label: '서비스 이용약관', href: '/terms' },
  ],
} as const;

export default function PageFooter() {
  return (
    <footer className="w-full bg-white border-t border-gray-200">
      <div className="mx-auto max-w-6xl px-8 py-8 sm:px-12 md:px-16">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex max-w-sm flex-col items-center gap-3 text-center sm:items-start sm:text-left">
            <Link href="/" className="flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-primary1/30">
              <Image
                src="/static/images/foryoutail-textonly-240.png"
                alt="포유테일 로고"
                width={120}
                height={24}
                className="shrink-0"
              />
            </Link>
            <p className="text-xs leading-6 text-gray-600">
              유기동물 공고, 보호소 정보, 커뮤니티 경험을 하나의 흐름으로 연결하는 입양 탐색 서비스.
            </p>
            <a
              href="https://www.instagram.com/kkosunnae_official/"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded text-gray-600 transition-colors hover:text-primary1 focus:outline-none focus:ring-2 focus:ring-primary1/30"
              aria-label="Instagram 포유테일 인스타그램"
            >
              <span className="text-xs">Instagram</span>
            </a>
            <a
              href="mailto:kkosunnaekr1@gmail.com"
              className="flex items-center gap-2 rounded text-gray-600 transition-colors hover:text-primary1 focus:outline-none focus:ring-2 focus:ring-primary1/30"
              aria-label="kkosunnaekr1@gmail.com 포유테일 이메일"
            >
              <span className="text-xs">kkosunnaekr1@gmail.com</span>
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8 min-[500px]:grid-cols-3 sm:gap-10">
            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <div key={title} className="min-w-0">
                <h3 className="mb-3 text-sm font-bold text-gray-900">{title}</h3>
                <ul className="flex flex-col gap-2">
                  {links.map(({ label, href }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="break-words rounded text-xs text-gray-600 hover:text-primary1 hover:underline focus:outline-none focus:ring-2 focus:ring-primary1/30"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-1 border-t border-gray-100 pt-6 text-center text-xs text-gray-600">
          <div>created by lee yeaseul</div>
          <div>© copyright 2025. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
