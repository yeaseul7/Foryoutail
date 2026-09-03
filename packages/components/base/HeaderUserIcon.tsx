'use client';
import Link from 'next/link';
import { useUserProfile } from '@/hooks/useUserProfile';
import UserProfile from '../common/UserProfile';

export default function HeaderUserIcon() {
  const { photoURL: userPhotoURL, nickname: userDisplayName } =
    useUserProfile();

  return (
    <Link
      href="/mypage"
      className="ml-2 flex cursor-pointer items-center rounded-full transition-opacity hover:opacity-80"
      aria-label="프로필"
    >
      <UserProfile
        profileUrl={userPhotoURL || ''}
        profileName={userDisplayName || ''}
        imgSize={40}
        sizeClass="w-10 h-10"
        existName={false}
        iconSize="text-xl"
      />
    </Link>
  );
}
