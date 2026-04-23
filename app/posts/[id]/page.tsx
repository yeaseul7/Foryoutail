'use client';

import PageTemplate from '@/packages/components/base/PageTemplate';
import PostScrollList from '@/packages/components/home/post/PostScrollList';
import UserHeader from '@/packages/components/home/profile/UserHeader';
import ProfileSwitchTag, { type ProfileCategory } from '@/packages/components/home/ProfileSwitchTag';
import LikedAnimalList from '@/packages/components/shelter/LikedAnimalList';
import FavoriteShelterList from '@/packages/components/shelter/FavoriteShelterList';
import { useAuth } from '@/lib/firebase/auth';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function PostsListPage() {
  const params = useParams();
  const userId = params.id as string;
  const { user } = useAuth();
  const [category, setCategory] = useState<ProfileCategory>('posts');

  const isOwnProfile = user?.uid === userId;

  return (
    <main className="page-container-full">
      <PageTemplate>
        <div className="flex flex-col gap-4 px-4 mx-auto w-full max-w-4xl sm:px-6 lg:px-8">
          <UserHeader />
          <ProfileSwitchTag category={category} setCategory={setCategory} isOwnProfile={isOwnProfile} />
          {category === 'posts' && <PostScrollList userId={userId} />}
          {category === 'favoriteShelters' && isOwnProfile && (
            <FavoriteShelterList userId={userId} />
          )}
          {category === 'likedAnimals' && isOwnProfile && (
            <LikedAnimalList userId={userId} />
          )}
        </div>
      </PageTemplate>
    </main>
  );
}
