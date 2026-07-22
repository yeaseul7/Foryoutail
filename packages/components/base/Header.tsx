'use client';

import RoundButton from '../common/RoundButton';
import { useCallback, useState, useRef } from 'react';
import { useClickOutside } from '@/packages/utils/clickEvent';
import dynamic from 'next/dynamic';
import HeaderUserIcon from './HeaderUserIcon';
import HeaderUserMenu from './HeaderUserMenu';
import { useAuth } from '@/lib/supabase/auth';
import Link from 'next/link';
import NavLink from '../common/NavLink';
import { usePathname } from 'next/navigation';

const LoginModal = dynamic(
  () => import('../auth/LoginModal'),
  { ssr: false }
);

interface HeaderProps {
  visibleHeaderButtons?: boolean;
}
export default function Header({ visibleHeaderButtons = true }: HeaderProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <header className="sticky top-0 z-50 w-full bg-main border-b border-gray-200">
      <div className="flex justify-between items-center px-4 mx-auto w-full max-w-7xl h-16 sm:px-6">
        <div className="flex items-center gap-4 md:gap-10">
          <Link
            href="/"
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <span className="text-xl font-extrabold tracking-[-0.04em] text-[#176de5]">
              꼬순내
            </span>
          </Link>

          {/* 데스크탑 메뉴 */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <NavLink
              to="/"
              activeClassName="active"
              isActive={() =>
                pathname === '/'
              }
              className={`!border-b-0 !p-0 text-sm lg:text-base transition-colors ${pathname === '/'
                ? '!text-primary1 font-semibold'
                : '!text-gray-700 hover:!text-primary1'
                }`}
            >
              <span className="inline-flex items-center gap-1.5">
                AI 찾기
              </span>
            </NavLink>
            <NavLink
              to="/shelter"
              activeClassName="active"
              isActive={() => pathname === '/shelter' || pathname.startsWith('/shelter')}
              className={`!border-b-0 !p-0 text-sm lg:text-base transition-colors ${pathname === '/shelter' || pathname.startsWith('/shelter')
                ? '!text-primary1 font-semibold'
                : '!text-gray-700 hover:!text-primary1'
                }`}
            >
              <span className="inline-flex items-center gap-1.5">
                입양하기
              </span>
            </NavLink>
          </div>

          {/* 모바일 햄버거 버튼 */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-gray-100"
            aria-label="메뉴"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        {visibleHeaderButtons && (
          <div className="flex gap-1 items-center sm:gap-2">
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
                  <RoundButton onClick={openLoginModal}>로그인</RoundButton>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 모바일 메뉴 - 헤더 하단에 자연스럽게 확장 */}
      <div
        className={`md:hidden border-t border-gray-200 bg-white transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-[22rem] opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="px-4 py-2 max-w-7xl mx-auto">
          <NavLink
            to="/"
            activeClassName="active"
            isActive={() =>
              pathname === '/'
            }
            className={`block px-4 py-3 !border-b-0 text-sm transition-colors hover:bg-gray-50 rounded-lg ${pathname === '/'
              ? '!text-primary1 bg-blue-50 font-semibold'
              : '!text-gray-700'
              }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="inline-flex items-center gap-2">
              AI 찾기
            </span>
          </NavLink>
          <NavLink
            to="/shelter"
            activeClassName="active"
            isActive={() => pathname === '/shelter' || pathname.startsWith('/shelter')}
            className={`block px-4 py-3 !border-b-0 text-sm transition-colors hover:bg-gray-50 rounded-lg ${pathname === '/shelter' || pathname.startsWith('/shelter')
              ? '!text-primary1 bg-blue-50 font-semibold'
              : '!text-gray-700'
              }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="inline-flex items-center gap-2">
              입양하기
            </span>
          </NavLink>
        </div>
      </div>

      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </header>
  );
}
