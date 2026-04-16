'use client';

import NoticeWriteContainer from '@/packages/ui/components/notice/NoticeWriteContainer';
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

export default function NoticeEditPage() {
  const params = useParams();
  const noticeId = typeof params?.id === 'string' ? params.id : undefined;

  return (
    <main className="grid h-screen min-h-screen w-full grid-rows-[1fr_auto]">
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <PageTemplate visibleHeaderButtons={false}>
          <div className="flex h-full min-h-0 w-full flex-col">
            <NoticeWriteContainer noticeId={noticeId} />
          </div>
        </PageTemplate>
      </div>
      <PageFooter />
    </main>
  );
}
