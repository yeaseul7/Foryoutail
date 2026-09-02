import type { Metadata } from 'next';
import PageTemplate from '@/packages/components/base/PageTemplate';
import PageFooter from '@/packages/components/base/PageFooter';
import CommunityPageContent from './CommunityPageContent';
import { getCommunityFeedPage } from '@/lib/server/community-posts';
import { generateDefaultMetadata, getBaseUrl } from '@/packages/utils/metadata';

export const revalidate = 30;

export const metadata: Metadata = generateDefaultMetadata(
  '오순도순',
  '반려동물과 입양 이야기를 함께 나누는 꼬순내 커뮤니티입니다.',
  `${getBaseUrl().replace(/\/$/, '')}/community`,
  { includeCanonical: true },
);

export default async function CommunityPage() {
  const initialPage = await getCommunityFeedPage().catch(() => ({ posts: [], nextCursor: null }));

  return (
    <main className="page-container-full">
      <PageTemplate>
        <CommunityPageContent initialPage={initialPage} />
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
