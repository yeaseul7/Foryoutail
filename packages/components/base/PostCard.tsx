'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect, useMemo } from 'react';
import { HiHeart } from 'react-icons/hi2';
import { HiChatBubbleLeft } from 'react-icons/hi2';
import { PostData } from '@/packages/type/postType';
import { stripTagHashes } from '@/lib/community/boardSuggestedTags';
import getOptimizedCloudinaryUrl from '@/packages/utils/optimization';
import UserProfile from '../common/UserProfile';
import CardImage from '@/packages/components/common/CardImage';

interface PostCardProps {
  post: PostData;
  highPriority?: boolean;
  highQuality?: boolean;
}

export default function PostCard({ post, highPriority = false, highQuality = false }: PostCardProps) {
  const router = useRouter();
  const [commentCount, setCommentCount] = useState<number>(0);

  const extractText = (html: string): string => {
    if (!html) return '';
    const text = html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > 100 ? text.substring(0, 50) + '...' : text;
  };

  const extractFirstImage = (html: string | undefined): string | null => {
    if (!html || typeof html !== 'string') {
      return null;
    }

    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
    const match = html.match(imgRegex);

    if (match && match[1]) {
      return match[1];
    }

    return null;
  };

  const rawThumbnailImage = extractFirstImage(post.content);

  const thumbnailImage = useMemo(() => {
    if (!rawThumbnailImage) return null;
    const imageSize = highQuality ? 600 : 300;
    return getOptimizedCloudinaryUrl(rawThumbnailImage, imageSize, imageSize);
  }, [rawThumbnailImage, highQuality]);

  const defaultImage = useMemo(() => {
    if (!post.tags || post.tags.length === 0) {
      return '/static/images/defaultDog.png';
    }
    const catTags = ['고양이', '냥냥이', '냥이', '냥', '냐옹', '츄르', '야옹'];
    if (catTags.some((cat) => post.tags.some((pt) => stripTagHashes(pt) === cat))) {
      return '/static/images/defaultCat.png';
    }
    return '/static/images/defaultDog.png';
  }, [post.tags]);

  const categoryBadge = useMemo((): { label: string; tone: string } | null => {
    if (post.category === 'adoption') {
      return {
        label: '입양후기',
        tone: 'bg-[#ffb36b]/95 text-white ring-1 ring-white/25',
      };
    }
    if (post.category === 'question') {
      return {
        label: '질문',
        tone: 'bg-[#6bc4a3]/95 text-white ring-1 ring-white/25',
      };
    }
    if (post.category === 'daily' || post.category === 'pet-life' || !post.category) {
      return {
        label: '일상',
        tone: 'bg-[#4a9fe5]/95 text-white ring-1 ring-white/25',
      };
    }
    return null;
  }, [post.category]);

  const previewTags = useMemo(() => {
    const normalized = (post.tags || [])
      .map((tag) => stripTagHashes(tag))
      .filter(Boolean);
    return normalized.slice(0, 2);
  }, [post.tags]);

  useEffect(() => {
    const fetchCommentCount = async () => {
      if (!post.id) return;
      try {
        const { count, error } = await supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', post.id);

        if (error) {
          throw error;
        }

        setCommentCount(count ?? 0);
      } catch (error) {
        console.error('댓글 개수 가져오기 실패:', error);
      }
    };

    fetchCommentCount();
  }, [post.id]);

  return (
    <article
      key={post.id}
      onClick={() => router.push(`/read/${post.id}`)}
      className="flex overflow-hidden flex-col bg-white rounded-2xl shadow-sm transition-all duration-200 cursor-pointer hover:shadow-lg hover:translate-y-1 active:translate-y-0 active:shadow-sm"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-200">
        <CardImage
          src={thumbnailImage || defaultImage}
          alt={post.title || '게시물 이미지'}
          className="h-full w-full object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={highPriority}
          fetchPriority={highPriority ? 'high' : 'auto'}
          quality={highQuality ? 90 : 75}
        />
        {categoryBadge && (
          <span
            className={`absolute left-2.5 top-2.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:text-[13px] ${categoryBadge.tone}`}
          >
            {categoryBadge.label}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5 sm:px-4 sm:pb-4 sm:pt-3">
        <h2 className="mb-1.5 line-clamp-1 text-base font-semibold leading-snug text-gray-900 sm:text-lg">
          {post.title}
        </h2>
        <p className="mb-2 line-clamp-3 text-xs leading-relaxed text-gray-600 sm:text-sm">
          {extractText(post.content)}
        </p>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {previewTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-[#d8e2ff] bg-[linear-gradient(180deg,#f7faff_0%,#eef3ff_100%)] px-2.5 py-1 text-[11px] font-semibold tracking-[-0.01em] text-[#5873de] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-0.5">
          <UserProfile
            profileUrl={post.authorPhotoURL || ''}
            profileName={post.authorName || ''}
            imgSize={40}
            sizeClass="w-8 h-8"
            existName={true}
            iconSize="text-xl"
            nameClassName="text-sm font-medium text-gray-800"
          />

          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-1.5 text-gray-400">
              <HiHeart className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              <span className="text-sm font-semibold tabular-nums text-gray-800">
                {post.likes || 0}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sky-300">
              <HiChatBubbleLeft className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              <span className="text-sm font-semibold tabular-nums text-gray-800">
                {commentCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
