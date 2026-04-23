import Image from 'next/image';
import Link from 'next/link';

const FOOTER_LINKS = {
  서비스: [
    { label: '홈', href: '/' },
    { label: '유기동물 보호소', href: '/animalShelter' },
    { label: '입양 공고', href: '/shelter' },
    { label: '커뮤니티', href: '/community' },
    { label: '카드뉴스', href: '/card_news' },
  ],
} as const;

export default function PageFooter() {
  return (
    <footer className="w-full bg-white border-t border-gray-200">
      <div className="mx-auto max-w-6xl px-8 py-8 sm:px-12 md:px-16">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-center sm:items-start gap-3">
            <Link href="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary1/30 rounded">
              <Image
                src="/static/images/foryoutail-textonly.png"
                alt="포유테일 로고"
                width={120}
                height={120}
                className="shrink-0"
              />
            </Link>
            <a
              href="https://www.instagram.com/kkosunnae_official/"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-primary1 focus:outline-none focus:ring-2 focus:ring-primary1/30 rounded transition-colors"
              aria-label="포유테일 인스타그램"
            >
              <span className="text-xs">Instagram</span>
            </a>
            <a
              href="mailto:kkosunnaekr1@gmail.com"
              className="flex items-center gap-2 text-gray-600 hover:text-primary1 focus:outline-none focus:ring-2 focus:ring-primary1/30 rounded transition-colors"
              aria-label="포유테일 이메일"
            >
              <span className="text-xs">kkosunnaekr1@gmail.com</span>
            </a>
          </div>
          <div className="grid grid-cols-2 min-[500px]:grid-cols-3 gap-8 sm:gap-10">
            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <div key={title} className="min-w-0">
                <h3 className="mb-3 text-sm font-bold text-gray-900">{title}</h3>
                <ul className="flex flex-col gap-2">
                  {links.map(({ label, href }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-xs text-gray-600 hover:text-primary1 hover:underline focus:outline-none focus:ring-2 focus:ring-primary1/30 rounded break-words"
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

        {/* 하단: 저작권 */}
        <div className="mt-8 flex flex-col items-center gap-1 border-t border-gray-100 pt-6 text-center text-xs text-gray-500">
          <div>created by lee yeaseul</div>
          <div>© copyright 2025. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
