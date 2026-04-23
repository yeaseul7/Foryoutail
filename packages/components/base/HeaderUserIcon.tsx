'use client';
import { useUserProfile } from '@/hooks/useUserProfile';
import UserProfile from '../common/UserProfile';

export default function HeaderUserIcon({
  setIsUserMenuOpen,
  isUserMenuOpen,
}: {
  setIsUserMenuOpen: (isOpen: boolean) => void;
  isUserMenuOpen: boolean;
}) {
  const { photoURL: userPhotoURL, nickname: userDisplayName } =
    useUserProfile();

  return (
    <button
      className="flex items-center ml-2 cursor-pointer group"
      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
    >
      <UserProfile
        profileUrl={userPhotoURL || ''}
        profileName={userDisplayName || ''}
        imgSize={40}
        sizeClass="w-10 h-10"
        existName={false}
        iconSize="text-xl"
      />
      <span className="ml-1 text-text3 transition-all duration-125 ease-in -mr-1.75 text-lg group-hover:text-text1">
        ▾
      </span>
    </button>
  );
}
