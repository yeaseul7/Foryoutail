'use client';

import PageTemplate from '@/packages/components/base/PageTemplate';
import PageFooter from '@/packages/components/base/PageFooter';
import ReadPostContentClientOnly from '@/packages/components/home/read/ReadPostContentClientOnly';
import { useParams } from 'next/navigation';

export default function ReadPostPage() {
  const params = useParams<{ id: string }>();
  const postId = params.id;

  return (
    <main className="page-container-full">
      <PageTemplate visibleHeaderButtons={true}>
        <ReadPostContentClientOnly postId={postId} />
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
