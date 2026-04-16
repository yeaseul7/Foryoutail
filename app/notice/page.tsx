'use client';
import NoticeList from '@/packages/ui/components/notice/NoticeList';
import dynamic from 'next/dynamic';

const PageTemplate = dynamic(
    () => import('@/packages/ui/components/base/PageTemplate'),
    { ssr: true }
);

const PageFooter = dynamic(
    () => import('@/packages/ui/components/base/PageFooter'),
    { ssr: true }
);




export default function NoticePage() {
    return (
        <main className="page-container-full">
            <PageTemplate>
                <div className="flex h-full min-h-0 w-full flex-col">
                    <NoticeList />
                </div>
            </PageTemplate>
            <PageFooter />
        </main>
    );
}
