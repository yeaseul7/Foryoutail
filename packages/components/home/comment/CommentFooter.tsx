'use client';
import { useState, useEffect } from 'react';
import {
  doc,
  updateDoc,
  increment,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/firebase/auth';
import { CommentData } from '@/packages/type/commentType';
import type { CommentCollectionName } from './CommentList';
import { BsHeart, BsHeartFill, BsPlusSquare } from 'react-icons/bs';
import ReplyWrite from './ReplyWrite';
import ReplyList from './ReplyList';
import { createHistory, deleteHistoryByCommentLike } from '@/lib/domain/community/history';

export default function CommentFooter({
  commentData,
  postId,
  collectionName = 'boards',
}: {
  commentData: CommentData;
  postId: string;
  collectionName?: CommentCollectionName;
}) {
  const { user } = useAuth();
  const [likes, setLikes] = useState<number>(commentData.likes || 0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReplyWriting, setIsReplyWriting] = useState(false);
  const [isReplyListOpen, setIsReplyListOpen] = useState(false);
  const [replyCount, setReplyCount] = useState<number>(0);
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!postId || !commentData.id) {
        setLoading(false);
        return;
      }

      try {
        const commentRef = doc(
          firestore,
          collectionName,
          postId,
          'comments',
          commentData.id,
        );
        const commentDoc = await getDoc(commentRef);
        if (commentDoc.exists()) {
          const data = commentDoc.data();
          const likesCount = data.likes || 0;
          setLikes(likesCount);
        }

        if (user) {
          const likeListCollection = collection(
            firestore,
            collectionName,
            postId,
            'comments',
            commentData.id,
            'likeList',
          );
          const userLikeDoc = doc(likeListCollection, user.uid);
          const userLikeSnapshot = await getDoc(userLikeDoc);
          setIsLiked(userLikeSnapshot.exists());
        } else {
          setIsLiked(false);
        }
      } catch (error) {
        console.error('댓글 좋아요 정보 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikeStatus();
  }, [postId, commentData.id, user, collectionName]);

  useEffect(() => {
    if (!postId || !commentData.id) return;

    const repliesCollection = collection(
      firestore,
      collectionName,
      postId,
      'comments',
      commentData.id,
      'replies',
    );

    const unsubscribe = onSnapshot(repliesCollection, (snapshot) => {
      setReplyCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [postId, commentData.id, collectionName]);

  const handleReply = () => {
    setIsReplyWriting((prev) => !prev);
  };

  const handleLike = async () => {
    if (!user) {
      alert('좋아요를 누르려면 로그인이 필요합니다.');
      return;
    }

    if (!postId || !commentData.id || isUpdating) return;

    setIsUpdating(true);
    try {
      const commentRef = doc(
        firestore,
        collectionName,
        postId,
        'comments',
        commentData.id,
      );
      const commentDoc = await getDoc(commentRef);

      if (!commentDoc.exists()) {
        alert('댓글을 찾을 수 없습니다.');
        return;
      }

      const likeListCollection = collection(
        firestore,
        collectionName,
        postId,
        'comments',
        commentData.id,
        'likeList',
      );
      const userLikeDoc = doc(likeListCollection, user.uid);

      if (isLiked) {
        const commentDocData = commentDoc.data();
        if (collectionName === 'boards' && commentDocData?.authorId) {
          await deleteHistoryByCommentLike(commentData.id, postId, user.uid);
        }
        await deleteDoc(userLikeDoc);
        await updateDoc(commentRef, {
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
        await updateDoc(commentRef, {
          likes: increment(1),
        });
        setLikes((prev) => prev + 1);
        setIsLiked(true);

        const commentDocData = commentDoc.data();
        if (collectionName === 'boards' && commentDocData?.authorId) {
          await createHistory(
            commentDocData.authorId,
            user.uid,
            'like',
            'comment',
            commentData.id,
            postId,
            commentData.id,
          );
        }
      }
    } catch (error) {
      console.error('댓글 좋아요 업데이트 실패:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2 justify-between items-center mt-4">
        <div></div>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1 items-center text-gray-400">
            <BsHeart />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mx-4 mt-2">
      <div className="flex gap-2 justify-between items-center w-full">
        <div>
          {replyCount > 0 ? (
            <button
              onClick={() => setIsReplyListOpen((prev) => !prev)}
              className="flex gap-1 items-center text-xs text-primary1"
            >
              <BsPlusSquare className="w-3 h-3" />
              {replyCount}개의 대댓글
            </button>
          ) : (
            <button
              onClick={handleReply}
              className="flex gap-1 items-center text-xs text-primary1"
            >
              <BsPlusSquare className="w-3 h-3" />
              답글 달기
            </button>
          )}
        </div>
        <button
          onClick={handleLike}
          disabled={isUpdating}
          className={`flex gap-1 items-center transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-75 ${isLiked ? 'text-red-500' : 'text-primary1'
            }`}
        >
          {isLiked ? <BsHeartFill /> : <BsHeart />}
          {likes > 0 && <span className="text-sm">{likes}</span>}
        </button>
      </div>

      {isReplyWriting && commentData.id && (
        <ReplyWrite
          postId={postId}
          commentId={commentData.id}
          collectionName={collectionName}
          onReplySubmitted={() => setIsReplyWriting(false)}
        />
      )}
      {isReplyListOpen && commentData.id && (
        <ReplyList
          postId={postId}
          commentId={commentData.id}
          collectionName={collectionName}
          onReplyListClosed={() => setIsReplyListOpen(false)}
        />
      )}
    </div>
  );
}
