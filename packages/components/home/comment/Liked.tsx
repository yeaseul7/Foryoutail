'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { HiOutlineHeart } from 'react-icons/hi2';
import { BsShare } from 'react-icons/bs';

export default function Liked() {
  const params = useParams();
  const postId = params.id as string;
  const [likes, setLikes] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikes = async () => {
      if (!postId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        setLikes(data?.likes_count ?? 0);
      } catch (error) {
        console.error('좋아요 정보 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [postId]);

  const handleShare = async () => {
    if (!postId) return;
    const url = `${window.location.origin}/read/${postId}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        alert('공유 링크가 복사되었습니다.');
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, 99999); // 모바일 지원

        try {
          const successful = document.execCommand('copy');
          if (successful) {
            alert('공유 링크가 복사되었습니다.');
          } else {
            throw new Error('복사 실패');
          }
        } catch (err) {
          prompt('공유 링크를 복사하세요:', url);
          console.error('클립보드 복사 실패:', err);
        } finally {
          document.body.removeChild(textarea);
        }
      }
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      prompt('공유 링크를 복사하세요:', url);
    }
  };

  if (loading) {
    return null;
  }

  return (
      <div className="mt-6 flex items-center justify-center border-t border-slate-200 pt-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm"
            aria-label="좋아요 수"
          >
            <HiOutlineHeart className="h-5 w-5" />
            <span className="text-sm font-semibold">{likes}</span>
          </div>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            aria-label="공유"
          >
            <BsShare className="h-5 w-5" />
            <span className="text-sm font-semibold">공유</span>
          </button>
        </div>
      </div>
  );
}
