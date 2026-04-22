'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  deleteDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/firebase/auth';
import { HiHeart, HiOutlineHeart } from 'react-icons/hi2';
import { BsShare } from 'react-icons/bs';
import { createHistory, deleteHistoryByPostLike } from '@/lib/domain/community/history';

export default function Liked() {
  const params = useParams();
  const postId = params.id as string;
  const { user } = useAuth();
  const [likes, setLikes] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchLikes = async () => {
      if (!postId) {
        setLoading(false);
        return;
      }

      try {
        const postDoc = await getDoc(doc(firestore, 'boards', postId));
        if (postDoc.exists()) {
          const data = postDoc.data();
          const likesCount = data.likes || 0;
          setLikes(likesCount);
        }

        if (user) {
          const likeListCollection = collection(
            firestore,
            'boards',
            postId,
            'likeList',
          );
          const userLikeDoc = doc(likeListCollection, user.uid);
          const userLikeSnapshot = await getDoc(userLikeDoc);
          setIsLiked(userLikeSnapshot.exists());
        } else {
          setIsLiked(false);
        }
      } catch (error) {
        console.error('좋아요 정보 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [postId, user]);

  const handleLike = async () => {
    if (!user) {
      alert('좋아요를 누르려면 로그인이 필요합니다.');
      return;
    }

    if (!postId || isUpdating) return;

    setIsUpdating(true);

    try {
      const postRef = doc(firestore, 'boards', postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        alert('게시물을 찾을 수 없습니다.');
        return;
      }

      const likeListCollection = collection(
        firestore,
        'boards',
        postId,
        'likeList',
      );
      const userLikeDoc = doc(likeListCollection, user.uid);

      if (isLiked) {
        const postData = postDoc.data();
        if (postData?.authorId) {
          await deleteHistoryByPostLike(postId, user.uid);
        }
        await deleteDoc(userLikeDoc);
        await updateDoc(postRef, {
          likes: increment(-1),
        });
        setLikes((prev) => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        await setDoc(userLikeDoc, {
          uid: user.uid,
          isLiked: true,
          createdAt: serverTimestamp(),
        });
        await updateDoc(postRef, {
          likes: increment(1),
        });
        setLikes((prev) => prev + 1);
        setIsLiked(true);

        const postData = postDoc.data();
        if (postData?.authorId) {
          await createHistory(
            postData.authorId,
            user.uid,
            'like',
            'post',
            postId,
            postId,
          );
        }
      }
    } catch (error) {
      console.error('좋아요 업데이트 실패:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };
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
    <>
      {/* 모바일 버전 - 게시물 내부에 표시 */}
      <div className="flex gap-3 justify-center items-center py-4 md:hidden">
        <button
          onClick={handleLike}
          disabled={isUpdating}
          className={`flex gap-2 items-center px-4 py-2 rounded-full ${
            isLiked
              ? 'text-white bg-red-500 hover:bg-red-600'
              : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          aria-label="좋아요"
        >
          {isLiked ? (
            <HiHeart className="w-5 h-5" />
          ) : (
            <HiOutlineHeart className="w-5 h-5" />
          )}
          <span className="text-sm font-semibold">{likes}</span>
        </button>
        <button
          onClick={handleShare}
          className="flex gap-2 items-center px-4 py-2 text-gray-700 bg-white rounded-full border border-gray-200 cursor-pointer hover:bg-gray-50"
          aria-label="공유"
        >
          <BsShare className="w-5 h-5" />
          <span className="text-sm font-semibold">공유</span>
        </button>
      </div>
      {/* 데스크톱 버전 - fixed 위치 */}
      <div className="hidden fixed top-2/5 -translate-y-1/2 right-4 xl:right-[calc((100vw-1152px)/2-4rem)] z-50 md:block">
        <div className="flex flex-col gap-3 justify-center items-center p-2 shadow-lg transition-all duration-200 rounded-4xl bg-gray-1">
          <button
            onClick={handleLike}
            disabled={isUpdating}
            className={`rounded-full p-3 ${
              isLiked
                ? 'text-white bg-red-500 hover:bg-red-600'
                : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
            } ${
              isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            aria-label="좋아요"
          >
            {isLiked ? (
              <HiHeart className="w-5 h-5" />
            ) : (
              <HiOutlineHeart className="w-5 h-5" />
            )}
          </button>
          <span className="text-xs font-semibold">{likes}</span>
          <button
            onClick={handleShare}
            className={`p-3 rounded-full ${'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'} ${'cursor-pointer'}`}
            aria-label="공유"
          >
            <BsShare className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
