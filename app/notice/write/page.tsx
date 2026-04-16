'use client';
import NoticeWriteContainer from '@/packages/ui/components/notice/NoticeWriteContainer';
import dynamic from 'next/dynamic';

const PageTemplate = dynamic(
    () => import('@/packages/ui/components/base/PageTemplate'),
    { ssr: true }
);

const PageFooter = dynamic(
    () => import('@/packages/ui/components/base/PageFooter'),
    { ssr: true }
);




export default function NoticeWritePage() {
    return (
        <main className="page-container-full">
            <PageTemplate visibleHeaderButtons={false}>
                <div className="flex h-full min-h-0 flex-col w-full">
                    <NoticeWriteContainer />
                </div>
            </PageTemplate>
            <PageFooter />
        </main>
    );
}
