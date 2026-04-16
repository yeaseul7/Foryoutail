'use client';
import PageTemplate from '@/packages/ui/components/base/PageTemplate';
import dynamic from 'next/dynamic';
import WriteContainerSkeleton from '@/packages/ui/components/base/WriteContainerSkeleton';

// Tiptap을 사용하는 EditContainer를 동적 import로 지연 로드
const EditContainer = dynamic(
  () => import('@/packages/ui/components/home/edit/editContainer'),
  {
    ssr: false,
    loading: () => <WriteContainerSkeleton />
  }
);

export default function EditPostPage() {
  return (
    <main className="page-container-full">
      <PageTemplate visibleHeaderButtons={false}>
        <div className="flex flex-col w-full h-full min-h-0">
          <EditContainer className="flex-1 min-h-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 w-full" />
        </div>
      </PageTemplate>
    </main>
  );
}
