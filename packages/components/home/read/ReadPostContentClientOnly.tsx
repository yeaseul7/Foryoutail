'use client';

import dynamic from 'next/dynamic';
import type { PostData } from '@/packages/type/postType';
import ReadPostContentSkeleton from '@/packages/components/skeleton/ReadPostContentSkeleton';

const ReadPostContent = dynamic(() => import('./ReadPostContent'), {
  ssr: false,
  loading: () => <ReadPostContentSkeleton />,
});

export default function ReadPostContentClientOnly({
  postId,
  initialPost,
}: {
  postId: string;
  initialPost?: PostData | null;
}) {
  return <ReadPostContent postId={postId} initialPost={initialPost} />;
}
