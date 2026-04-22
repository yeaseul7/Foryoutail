'use client';

import Image from 'next/image';
import RoundButton from '../common/RoundButton';
import { useCallback, useState, useRef, useEffect } from 'react';
import { useClickOutside } from '@/packages/utils/clickEvent';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import HeaderUserIcon from './HeaderUserIcon';
import HeaderUserMenu from './HeaderUserMenu';
import { useAuth } from '@/lib/firebase/auth';
import { getUnreadHistoryCount } from '@/lib/domain/community/history';
import Link from 'next/link';
import NavLink from '../common/NavLink';
import { usePathname } from 'next/navigation';
import { MdPets, MdAutoAwesome, MdForum, MdHomeWork } from 'react-icons/md';

const LoginModal = dynamic(
  () => import('../auth/LoginModal'),
  { ssr: false }
);

const NotificationPop = dynamic(
  () => import('../home/notification/NotificationPop'),
  { ssr: false }
);

interface HeaderProps {
  visibleHeaderButtons?: boolean;
}
export default function Header({ visibleHeaderButtons = true }: HeaderProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationPopOpen, setIsNotificationPopOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadHistoryCount, setUnreadHistoryCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useClickOutside<HTMLDivElement>(
    userMenuRef,
    () => setIsUserMenuOpen(false),
    isUserMenuOpen,
  );

  useClickOutside<HTMLDivElement>(
    notificationRef,
    () => setIsNotificationPopOpen(false),
    isNotificationPopOpen,
  );

  const handleNotificationClick = useCallback(() => {
    setIsNotificationPopOpen((prev) => !prev);
  }, []);

  const handleSearchClick = useCallback(() => {
    router.push('/community');
  }, [router]);

  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const fetchUnreadHistoryCount = async () => {
      if (!user?.uid) return;
      const unreadHistoryCount = await getUnreadHistoryCount(user.uid);
      setUnreadHistoryCount(unreadHistoryCount);
    };
    fetchUnreadHistoryCount();
  }, [user]);

  return (
    <header className="sticky top-0 z-50 w-full bg-main border-b border-gray-200">
      <div className="flex justify-between items-center px-4 mx-auto w-full max-w-7xl h-16 sm:px-6">
        <div className="flex items-center gap-4 md:gap-10">
          <Link
            href="/"
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <Image
              src="/static/images/foryoutail.png"
              alt="Logo"
              width={30}
              height={30}
              className="block md:hidden"
              loading="eager"
            />
            <Image
              src="/static/images/foryoutail-textonly.png"
              alt="Logo"
              width={120}
              height={120}
              className="hidden md:block"
              style={{ width: 'auto', height: 'auto' }}
              loading="eager"
            />
          </Link>

          {/* 데스크탑 메뉴 */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <NavLink
              to="/"
              activeClassName="active"
              isActive={() => pathname === '/'}
              className={`!border-b-0 !p-0 text-sm lg:text-base transition-colors ${pathname === '/' ? '!text-primary1 font-semibold' : '!text-gray-700 hover:!text-primary1'
                }`}
            >
              홈
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
                <MdPets className="h-4 w-4" aria-hidden />
                입양하기
              </span>
            </NavLink>
            <NavLink
              to="/search-animal"
              activeClassName="active"
              isActive={() =>
                pathname === '/search-animal' || pathname.startsWith('/search-animal')
              }
              className={`!border-b-0 !p-0 text-sm lg:text-base transition-colors ${pathname === '/search-animal' || pathname.startsWith('/search-animal')
                ? '!text-primary1 font-semibold'
                : '!text-gray-700 hover:!text-primary1'
                }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <MdAutoAwesome className="h-4 w-4" aria-hidden />
                AI 찾기
              </span>
            </NavLink>
            <NavLink
              to="/community"
              activeClassName="active"
              isActive={() => pathname === '/community'}
              className={`!border-b-0 !p-0 text-sm lg:text-base transition-colors ${pathname === '/community' ? '!text-primary1 font-semibold' : '!text-gray-700 hover:!text-primary1'
                }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <MdForum className="h-4 w-4" aria-hidden />
                커뮤니티
              </span>
            </NavLink>
            <NavLink
              to="/animalShelter"
              activeClassName="active"
              isActive={() => pathname === '/animalShelter' || pathname.startsWith('/animalShelter')}
              className={`!border-b-0 !p-0 text-sm lg:text-base transition-colors ${pathname === '/animalShelter' || pathname.startsWith('/animalShelter')
                ? '!text-primary1 font-semibold'
                : '!text-gray-700 hover:!text-primary1'
                }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <MdHomeWork className="h-4 w-4" aria-hidden />
                보호소
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
            <div ref={notificationRef} className="relative">
              <button
                className="relative p-2 rounded-full transition-all duration-200 hover:bg-gray-100 active:scale-95"
                onClick={handleNotificationClick}
                aria-label="알림"
              >
                <Image
                  src="/static/svg/icon-notification.svg"
                  alt="Notification"
                  width={24}
                  height={24}
                  className="transition-opacity hover:opacity-70"
                />
                {unreadHistoryCount > 0 && (
                  <span className="flex absolute top-0 right-0 justify-center items-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm">
                    {unreadHistoryCount > 99 ? '99+' : unreadHistoryCount}
                  </span>
                )}
              </button>
              {isNotificationPopOpen && (
                <NotificationPop
                  onClose={() => setIsNotificationPopOpen(false)}
                />
              )}
            </div>
            <button
              className="p-2 rounded-full transition-all duration-200 hover:bg-gray-100 active:scale-95"
              onClick={handleSearchClick}
              aria-label="검색"
            >
              <Image
                src="/static/svg/icon-search-3.svg"
                alt="Search"
                width={24}
                height={24}
                className="transition-opacity hover:opacity-70"
              />
            </button>
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
            isActive={() => pathname === '/'}
            className={`block px-4 py-3 !border-b-0 text-sm transition-colors hover:bg-gray-50 rounded-lg ${pathname === '/' ? '!text-primary1 bg-blue-50 font-semibold' : '!text-gray-700'
              }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            홈
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
              <MdPets className="h-4 w-4" aria-hidden />
              입양하기
            </span>
          </NavLink>
          <NavLink
            to="/search-animal"
            activeClassName="active"
            isActive={() =>
              pathname === '/search-animal' || pathname.startsWith('/search-animal')
            }
            className={`block px-4 py-3 !border-b-0 text-sm transition-colors hover:bg-gray-50 rounded-lg ${pathname === '/search-animal' || pathname.startsWith('/search-animal')
              ? '!text-primary1 bg-blue-50 font-semibold'
              : '!text-gray-700'
              }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="inline-flex items-center gap-2">
              <MdAutoAwesome className="h-4 w-4" aria-hidden />
              AI 찾기
            </span>
          </NavLink>
          <NavLink
            to="/community"
            activeClassName="active"
            isActive={() => pathname === '/community'}
            className={`block px-4 py-3 !border-b-0 text-sm transition-colors hover:bg-gray-50 rounded-lg ${pathname === '/community' ? '!text-primary1 bg-blue-50 font-semibold' : '!text-gray-700'
              }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="inline-flex items-center gap-2">
              <MdForum className="h-4 w-4" aria-hidden />
              커뮤니티
            </span>
          </NavLink>
          <NavLink
            to="/animalShelter"
            activeClassName="active"
            isActive={() => pathname === '/animalShelter' || pathname.startsWith('/animalShelter')}
            className={`block px-4 py-3 !border-b-0 text-sm transition-colors hover:bg-gray-50 rounded-lg ${pathname === '/animalShelter' || pathname.startsWith('/animalShelter')
              ? '!text-primary1 bg-blue-50 font-semibold'
              : '!text-gray-700'
              }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="inline-flex items-center gap-2">
              <MdHomeWork className="h-4 w-4" aria-hidden />
              보호소
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
