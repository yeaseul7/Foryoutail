'use client';
import { useAuth } from '@/lib/firebase/auth';
import { useClickOutsideModal } from '@/packages/utils/clickEvent';
import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';

export default function HeaderUserMenu({
  setIsUserMenuOpen,
  isUserMenuOpen,
}: {
  setIsUserMenuOpen: (isOpen: boolean) => void;
  isUserMenuOpen: boolean;
}) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  }, [logout]);

  useClickOutsideModal(
    userMenuRef,
    () => setIsUserMenuOpen(false),
    isUserMenuOpen,
  );

  return (
    <div className="absolute right-0 top-full mt-4 z-51">
      <div
        className="relative w-48 bg-element1 shadow-[0px_0px_8px_rgba(0,0,0,0.1)]"
        ref={userMenuRef}
      >
        <div className="flex flex-col gap-2 p-2">
          <button
            className="p-2 text-left rounded text-text1 hover:bg-element2"
            onClick={() => {
              if (user?.uid) {
                router.push(`/posts/${user.uid}`);
              }
            }}
            disabled={!user?.uid}
          >
            내 멍로그
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-left rounded text-text1 hover:bg-element2"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
