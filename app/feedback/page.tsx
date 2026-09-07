import type { Metadata } from 'next';
import PageTemplate from '@/packages/components/base/PageTemplate';
import PageFooter from '@/packages/components/base/PageFooter';
import { generateDefaultMetadata, getBaseUrl } from '@/packages/utils/metadata';
import FeedbackPageContent from './FeedbackPageContent';

export const metadata: Metadata = generateDefaultMetadata(
  '건의함',
  '꼬순내 서비스 개선 의견과 오류를 접수합니다.',
  `${getBaseUrl().replace(/\/$/, '')}/feedback`,
  { includeCanonical: true },
);

export default function FeedbackPage() {
  return (
    <main className="page-container-full">
      <PageTemplate>
        <FeedbackPageContent />
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
