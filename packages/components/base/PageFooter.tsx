'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/language';

const FOOTER_LINKS = {
  둘러보기: [
    { label: '입양 공고', href: '/shelter' },
  ],
  서비스: [
    { label: '회원가입', href: '/register' },
  ],
  정책: [
    { label: '개인정보처리방침', href: '/privacy' },
    { label: '서비스 이용약관', href: '/terms' },
  ],
} as const;

export default function PageFooter() {
  const { isEnglish } = useLanguage();
  const footerLinks = isEnglish
    ? {
        Explore: [{ label: 'Adoption listings', href: '/shelter' }],
        Service: [{ label: 'Sign up', href: '/register' }],
        Policies: [{ label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }],
      }
    : FOOTER_LINKS;

  return (
    <footer className="w-full bg-white border-t border-gray-200">
      <div className="mx-auto max-w-6xl px-8 py-8 sm:px-12 md:px-16">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex max-w-sm flex-col items-center gap-3 text-center sm:items-start sm:text-left">
            <Link href="/shelter" className="flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-primary1/30">
              <Image
                src="/static/images/kkosunnae-header-logo.png"
                alt={isEnglish ? 'Kkosunnae logo' : '꼬순내 로고'}
                width={150}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-xs leading-6 text-gray-600">
              {isEnglish ? 'Find shelter animal adoption listings across South Korea.' : '유기동물 공고를 빠르고 편하게 찾을 수 있는 서비스'}
            </p>
            <a
              href="https://www.instagram.com/earlys_day/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded text-gray-600 transition-colors hover:text-primary1 focus:outline-none focus:ring-2 focus:ring-primary1/30"
              aria-label={isEnglish ? 'Kkosunnae Instagram' : 'Instagram 꼬순내 인스타그램'}
            >
              <span className="text-xs">Instagram</span>
            </a>
            <a
              href="mailto:kkosunnaekr1@gmail.com"
              className="flex items-center gap-2 rounded text-gray-600 transition-colors hover:text-primary1 focus:outline-none focus:ring-2 focus:ring-primary1/30"
              aria-label={isEnglish ? 'Email Kkosunnae' : 'kkosunnaekr1@gmail.com 꼬순내 이메일'}
            >
              <span className="text-xs">kkosunnaekr1@gmail.com</span>
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8 min-[500px]:grid-cols-3 sm:gap-10">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title} className="min-w-0">
                <h3 className="mb-3 text-sm font-bold text-gray-900">{title}</h3>
                <ul className="flex flex-col gap-2">
                  {links.map(({ label, href }: { label: string; href: string }) => (
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
