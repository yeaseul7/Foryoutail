'use client';

import PageTemplate from '@/packages/ui/components/base/PageTemplate';
import PostScrollList from '@/packages/ui/components/home/post/PostScrollList';
import TagList from '@/packages/ui/components/home/post/TagList';
import UserHeader from '@/packages/ui/components/home/profile/UserHeader';
import ProfileSwitchTag, { type ProfileCategory } from '@/packages/ui/components/home/ProfileSwitchTag';
import LikedAnimalList from '@/packages/ui/components/shelter/LikedAnimalList';
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
      <PageTemplate visibleHomeTab={false}>
        <div className="flex flex-col gap-4 px-4 mx-auto w-full max-w-4xl sm:px-6 lg:px-8">
          <UserHeader />
          <ProfileSwitchTag category={category} setCategory={setCategory} isOwnProfile={isOwnProfile} />
          {category === 'posts' && (
            <>
              <TagList userId={userId} />
              <PostScrollList userId={userId} />
            </>
          )}
          {category === 'shelter' && isOwnProfile && (
            <LikedAnimalList userId={userId} />
          )}
        </div>
      </PageTemplate>
    </main>
  );
}
