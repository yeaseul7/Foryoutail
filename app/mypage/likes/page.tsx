'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiHeart } from 'react-icons/hi2';
import { useAuth } from '@/lib/supabase/auth';
import PageTemplate from '@/packages/components/base/PageTemplate';
import PageFooter from '@/packages/components/base/PageFooter';
import Loading from '@/packages/components/base/Loading';
import LikedAnimalList from '@/packages/components/shelter/LikedAnimalList';

export default function LikedAnimalsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [loading, user, router]);

  return (
    <main className="page-container-full">
      <PageTemplate>
        <section className="mx-auto w-full max-w-7xl flex-1 py-8 sm:py-10">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500">
              <HiHeart className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">찜한 동물</h1>
              <p className="mt-1 text-sm text-slate-500">관심 있게 본 아이들을 다시 확인해보세요.</p>
            </div>
          </div>
          {loading ? <Loading /> : user ? <LikedAnimalList userId={user.uid} /> : null}
        </section>
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
