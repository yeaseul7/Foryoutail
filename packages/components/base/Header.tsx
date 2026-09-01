'use client';

import RoundButton from '../common/RoundButton';
import { useCallback, useState, useRef, useSyncExternalStore } from 'react';
import { useClickOutside } from '@/packages/utils/clickEvent';
import LoginModal from '../auth/LoginModal';
import HeaderUserIcon from './HeaderUserIcon';
import HeaderUserMenu from './HeaderUserMenu';
import { useAuth } from '@/lib/supabase/auth';
import Link from 'next/link';
import Image from 'next/image';
import NavLink from '../common/NavLink';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/language';

interface HeaderProps {
  visibleHeaderButtons?: boolean;
}

const subscribeToHydration = () => () => {};

export default function Header({ visibleHeaderButtons = true }: HeaderProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const pathname = usePathname();
  const { language, setLanguage, isEnglish } = useLanguage();
  const { user, loading } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const userMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside<HTMLDivElement>(
    userMenuRef,
    () => setIsUserMenuOpen(false),
    isUserMenuOpen,
  );

  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen((prev) => !prev);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur">
      <div className="flex justify-between items-center px-4 mx-auto w-full max-w-7xl h-16 sm:px-6">
        <div className="flex items-center gap-4 md:gap-10">
          <Link
            href="/shelter"
            className="flex min-w-0 items-center transition-opacity hover:opacity-80"
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
              to="/shelter"
              activeClassName="active"
              isActive={() => pathname === '/shelter' || pathname.startsWith('/shelter')}
              className={`!border-b-0 !p-0 text-sm lg:text-base transition-colors ${pathname === '/shelter' || pathname.startsWith('/shelter')
                ? '!text-primary1 font-semibold'
                : '!text-[#817873] hover:!text-primary1'
                }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {isEnglish ? 'Adopt' : '입양하기'}
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
                  <div
                    ref={userMenuRef}
                    className="flex relative gap-2 items-center sm:gap-3"
                  >
                    <HeaderUserIcon
                      setIsUserMenuOpen={setIsUserMenuOpen}
                      isUserMenuOpen={isUserMenuOpen}
                    />
                    {isUserMenuOpen && (
                      <HeaderUserMenu
                        setIsUserMenuOpen={setIsUserMenuOpen}
                        isUserMenuOpen={isUserMenuOpen}
                      />
                    )}
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
      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </header>
  );
}
