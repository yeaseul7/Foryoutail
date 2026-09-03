import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { getCommunityPostBySlug } from '@/lib/server/community-posts';
import PageFooter from '@/packages/components/base/PageFooter';
import PageTemplate from '@/packages/components/base/PageTemplate';
import { formatCommunityPostDate } from '@/packages/utils/communityDate';
import CommunityPostActions from './CommunityPostActions';
import CommunityComments from './CommunityComments';
import CommunityPostEngagement from './CommunityPostEngagement';

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_PATH_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getCommunityPostBySlug(id);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt.slice(0, 160),
    openGraph: post.imageUrl ? { images: [post.imageUrl] } : undefined,
  };
}

export default async function CommunityPostPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getCommunityPostBySlug(id);
  if (!post) notFound();
  if (UUID_PATH_PATTERN.test(id)) redirect(`/community/${encodeURIComponent(post.slug)}`);
  const date = formatCommunityPostDate(post.createdAt);
  const authorName = post.authorName || '익명';

  return (
    <main className="page-container-full">
      <PageTemplate>
        <div className="mx-auto w-full max-w-3xl pb-7 pt-3 sm:pb-10 sm:pt-5">
          <article className="overflow-hidden rounded-3xl border border-[#eadfd7] bg-white shadow-[0_5px_18px_rgba(51,45,42,0.07)]">
        <div className="px-5 pb-1 pt-5 sm:px-7 sm:pb-2 sm:pt-7">
          <div className="flex min-w-0 items-center gap-2">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-xs font-extrabold text-primary1">
              {post.authorImageUrl ? <Image src={post.authorImageUrl} alt="" fill sizes="32px" className="object-cover" /> : authorName.slice(0, 1).toUpperCase()}
            </div>
            <span className="max-w-[35%] truncate text-sm font-bold text-[#332d2a]">{authorName}</span>
            {post.topic && (
              <>
                <span className="shrink-0 text-xs text-[#b1a8a2]" aria-hidden>›</span>
                <span className="max-w-[35%] truncate text-xs font-bold text-primary1">{post.topic}</span>
              </>
            )}
            <span className="shrink-0 text-xs text-[#9a918b]">· {date}</span>
            <CommunityPostActions post={post} />
          </div>
          <h1 className="mt-4 text-xl font-extrabold leading-8 text-[#332d2a] sm:text-2xl">{post.title}</h1>
          {post.contentFormat === 'RICH_HTML' ? (
            <div
              className="mt-5 break-words text-[15px] leading-7 text-[#5f5752] [&_a]:text-primary1 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary1/30 [&_blockquote]:pl-4 [&_figure]:m-0 [&_figure]:p-0 [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: post.safeHtml ?? '' }}
            />
          ) : (
            <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-[#5f5752]">{post.content}</p>
          )}
        </div>
        {post.contentFormat === 'PLAIN_TEXT' && post.imageUrls.length > 0 && (
          <div className="flex flex-col">
            {post.imageUrls.map((url, index) => (
              <div key={`${url}-${index}`} className="relative aspect-[16/10] w-full overflow-hidden bg-[#f5f2ef]">
                <Image src={url} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="scale-110 object-cover blur-2xl" aria-hidden />
                <div className="absolute inset-0 bg-black/15" aria-hidden />
                <Image src={url} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="z-10 object-contain" />
              </div>
            ))}
          </div>
        )}
        <CommunityPostEngagement post={post} />
        <CommunityComments postId={post.id} />
          </article>
        </div>
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
