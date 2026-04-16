'use client';

import NoticeReadContent from '@/packages/ui/components/notice/NoticeReadContent';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const PageTemplate = dynamic(
  () => import('@/packages/ui/components/base/PageTemplate'),
  { ssr: true }
);

const PageFooter = dynamic(
  () => import('@/packages/ui/components/base/PageFooter'),
  { ssr: true }
);

export default function NoticeReadPage() {
  const params = useParams();
  const noticeId = typeof params?.id === 'string' ? params.id : undefined;

  return (
    <main className="page-container-full">
      <PageTemplate visibleHeaderButtons={false}>
        <div className="flex h-full min-h-0 w-full flex-col overflow-auto">
          <NoticeReadContent noticeId={noticeId ?? ''} />
        </div>
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
