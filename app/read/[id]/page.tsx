import { Metadata } from 'next';
import { getPostById } from '@/lib/domain/community/post';
import PageTemplate from '@/packages/components/base/PageTemplate';
import PageFooter from '@/packages/components/base/PageFooter';
import ReadPostContentClientOnly from '@/packages/components/home/read/ReadPostContentClientOnly';
import {
  getBaseUrl,
  extractText,
  extractFirstImage,
  generateMetadata as generateMetadataUtil,
  generateDefaultMetadata,
} from '@/packages/utils/metadata';

export const runtime = 'edge';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: postId } = await params;
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/read/${postId}`;

  try {
    const post = await getPostById(postId);

    if (post) {
      const title = post.title || '게시물';
      const description =
        extractText(post.content).substring(0, 160) || '포유테일 게시물';
      const imageUrl = extractFirstImage(post.content);

      return generateMetadataUtil({
        title: `${title} `,
        description,
        imageUrl,
        url,
        type: 'article',
        imageAlt: title,
      });
    }
  } catch (error) {
    console.error('메타데이터 생성 중 오류:', error);
  }

  return generateDefaultMetadata(
    '게시물 | 포유테일',
    '포유테일 게시물',
    url,
    {
      type: 'article',
    },
  );
}

export default async function ReadPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: postId } = await params;
  const post = await getPostById(postId);

  return (
    <main className="page-container-full">
      <PageTemplate visibleHeaderButtons={true}>
        <ReadPostContentClientOnly postId={postId} initialPost={post} />
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
