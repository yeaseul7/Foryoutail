'use client';

import RoundButton from '../common/RoundButton';
import { useCallback, useState, useSyncExternalStore } from 'react';
import LoginModal from '../auth/LoginModal';
import HeaderUserIcon from './HeaderUserIcon';
import { useAuth } from '@/lib/supabase/auth';
import Link from 'next/link';
import Image from 'next/image';
import NavLink from '../common/NavLink';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/language';
import { MdClose, MdMenu } from 'react-icons/md';

interface HeaderProps {
  visibleHeaderButtons?: boolean;
}

const subscribeToHydration = () => () => {};

export default function Header({ visibleHeaderButtons = true }: HeaderProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { language, setLanguage, isEnglish } = useLanguage();
  const { user, loading } = useAuth();
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen((prev) => !prev);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur">
      <div className="flex justify-between items-center px-4 mx-auto w-full max-w-7xl h-16 sm:px-6">
        <div className="flex items-center gap-4 md:gap-10">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-[#332d2a] transition hover:bg-primary-soft md:hidden"
            aria-label={isEnglish ? 'Open menu' : '메뉴 열기'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <MdClose aria-hidden /> : <MdMenu aria-hidden />}
          </button>
          <Link
            href="/"
            className="hidden min-w-0 items-center transition-opacity hover:opacity-80 md:flex"
          >
            <Image
              src="/static/images/kkosunnae-header-logo.png"
              alt="꼬순내"
              width={150}
              height={32}
              priority
              className="h-6 w-auto max-w-[112px] object-contain sm:h-7 sm:max-w-none md:h-8"
            />
          </Link>

          {/* 데스크탑 메뉴 */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <NavLink
              to="/"
              activeClassName="active"
              isActive={() => pathname === '/' || /^\/\d+$/.test(pathname)}
              className={`!border-b-0 !p-0 text-sm lg:text-base transition-colors ${pathname === '/' || /^\/\d+$/.test(pathname)
                ? '!text-primary1 font-semibold'
                : '!text-[#817873] hover:!text-primary1'
                }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {isEnglish ? 'Adopt' : '입양하기'}
              </span>
            </NavLink>
            <NavLink
              to="/community"
              activeClassName="active"
              isActive={() => pathname === '/community' || pathname.startsWith('/community/')}
              className={`!border-b-0 !p-0 text-sm lg:text-base transition-colors ${pathname === '/community' || pathname.startsWith('/community/')
                ? '!text-primary1 font-semibold'
                : '!text-[#817873] hover:!text-primary1'
                }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {isEnglish ? 'Community' : '오순도순'}
              </span>
            </NavLink>
            <NavLink
              to="/feedback"
              activeClassName="active"
              isActive={() => pathname === '/feedback'}
              className={`!border-b-0 !p-0 text-sm lg:text-base transition-colors ${pathname === '/feedback'
                ? '!text-primary1 font-semibold'
                : '!text-[#817873] hover:!text-primary1'
                }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {isEnglish ? 'Feedback' : '건의함'}
              </span>
            </NavLink>
          </div>
        </div>
        {visibleHeaderButtons && (
          <div className="flex gap-1 items-center sm:gap-2">
            <div
              className="inline-flex h-9 items-center gap-1 rounded-full border border-[#eadfd7] bg-white/90 p-1 text-xs font-bold shadow-sm ring-1 ring-white/70 backdrop-blur transition-all hover:border-primary1/40 hover:shadow-md"
              role="group"
              aria-label={isEnglish ? 'Select language' : '언어 선택'}
            >
              <span className="hidden items-center pl-2 pr-0.5 text-primary1 sm:inline-flex" aria-hidden>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3z" />
                </svg>
              </span>
              <button
                type="button"
                disabled={!isHydrated}
                onClick={() => setLanguage('ko')}
                aria-pressed={language === 'ko'}
                className={`rounded-full px-3 py-1.5 transition-all disabled:cursor-wait ${language === 'ko' ? 'bg-primary1 text-white shadow-sm' : 'text-[#817873] hover:bg-primary-soft hover:text-[#332d2a]'}`}
              >
                KR
              </button>
              <button
                type="button"
                disabled={!isHydrated}
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
                className={`rounded-full px-3 py-1.5 transition-all disabled:cursor-wait ${language === 'en' ? 'bg-primary1 text-white shadow-sm' : 'text-[#817873] hover:bg-primary-soft hover:text-[#332d2a]'}`}
              >
                EN
              </button>
            </div>
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center">
                    <HeaderUserIcon />
                  </div>
                ) : (
                  <RoundButton className="h-9 min-w-[72px] px-3 text-xs sm:text-xs md:text-xs" onClick={openLoginModal}>
                    {isEnglish ? 'Log in' : '로그인'}
                  </RoundButton>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {isMobileMenuOpen && (
        <>
          <button type="button" className="fixed inset-0 top-16 z-40 cursor-default bg-black/10 md:hidden" onClick={() => setIsMobileMenuOpen(false)} aria-label={isEnglish ? 'Close menu' : '메뉴 닫기'} />
          <nav className="absolute left-4 top-full z-50 w-44 overflow-hidden rounded-2xl border border-[#eadfd7] bg-white p-1.5 text-sm font-bold shadow-xl md:hidden" aria-label={isEnglish ? 'Main menu' : '주 메뉴'}>
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={`block rounded-xl px-4 py-3 transition ${pathname === '/' || /^\/\d+$/.test(pathname) ? 'bg-primary1 text-white' : 'text-[#332d2a] hover:bg-primary-soft'}`}>
              {isEnglish ? 'Adopt' : '입양하기'}
            </Link>
            <Link href="/community" onClick={() => setIsMobileMenuOpen(false)} className={`mt-1 block rounded-xl px-4 py-3 transition ${pathname === '/community' || pathname.startsWith('/community/') ? 'bg-primary1 text-white' : 'text-[#332d2a] hover:bg-primary-soft'}`}>
              {isEnglish ? 'Community' : '오순도순'}
            </Link>
            <Link href="/feedback" onClick={() => setIsMobileMenuOpen(false)} className={`mt-1 block rounded-xl px-4 py-3 transition ${pathname === '/feedback' ? 'bg-primary1 text-white' : 'text-[#332d2a] hover:bg-primary-soft'}`}>
              {isEnglish ? 'Feedback' : '건의함'}
            </Link>
          </nav>
        </>
      )}
      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </header>
  );
}
