import type { Metadata } from 'next';
import PageTemplate from '@/packages/components/base/PageTemplate';
import FeedbackBoard from './FeedbackBoard';

export const metadata: Metadata = {
  title: '건의함 관리',
  robots: { index: false, follow: false },
};

export default function AdminFeedbackPage() {
  return (
    <main className="page-container-full">
      <PageTemplate>
        <FeedbackBoard />
      </PageTemplate>
    </main>
  );
}
