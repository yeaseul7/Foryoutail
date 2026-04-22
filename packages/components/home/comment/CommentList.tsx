'use client';
import { firestore } from '@/lib/firebase/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import CommentContainer from './CommentContainer';
import { CommentData } from '@/packages/type/commentType';
import { useRouter } from 'next/navigation';
import UserProfile from '../../common/UserProfile';
import { useUserProfiles } from '@/hooks/useUserProfile';
import { HiChatBubbleLeft } from 'react-icons/hi2';

export type CommentCollectionName = 'boards' | 'notice';

export default function CommentList({
  postId,
  postAuthorId,
  collectionName = 'boards',
}: {
  postId: string;
  postAuthorId?: string;
  collectionName?: CommentCollectionName;
}) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);

  // 작성자 정보 가져오기
  const authorIds = comments
    .map((comment) => comment.authorId)
    .filter((id): id is string => id !== null && id !== undefined);
  const authorInfoMap = useUserProfiles(authorIds);

  useEffect(() => {
    if (!postId) {
      return;
    }

    const commentCollection = collection(
      firestore,
      collectionName,
      postId,
      'comments',
    );
    const q = query(commentCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as unknown as CommentData[];
        setComments(commentsList);
        setLoading(false);
      },
      (error) => {
        console.error('댓글 조회 중 오류 발생:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [postId, collectionName]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 text-gray-500">
        댓글을 불러오는 중...
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex justify-center items-center py-8 text-gray-500">
        아직 댓글이 없습니다.
      </div>
    );
  }
  const handleClickAuthor = (authorId: string) => {
    if (!authorId) return;
    router.push(`/posts/${authorId}`);
  };

  const enrichedComments = comments.map((comment) => {
    if (!comment.authorId) return comment;

    const authorInfo = authorInfoMap.get(comment.authorId);
    if (authorInfo) {
      return {
        ...comment,
        authorName: authorInfo.nickname || '탈퇴한 사용자',
        authorPhotoURL: authorInfo.photoURL ?? null,
      };
    }

    return comment;
  });
  return (
    <div className="flex flex-col gap-4 p-4 px-4 w-full sm:px-6 md:px-10">
      <div className="flex gap-2 items-center text-primary1">
        <HiChatBubbleLeft className="w-5 h-5" /><div className="text-sm text-gray-500">댓글 {comments.length}</div>
      </div>
      {enrichedComments.map((comment, index) => {
        const authorInfo = comment.authorId
          ? authorInfoMap.get(comment.authorId)
          : null;
        const displayPhotoURL =
          authorInfo?.photoURL ?? comment.authorPhotoURL ?? null;
        const displayName =
          authorInfo?.nickname ?? comment.authorName ?? '탈퇴한 사용자';

        return (
          <div
            key={comment.id}
            className={`flex gap-3 p-2 sm:p-4 w-full items-start ${index !== enrichedComments.length - 1
                ? 'border-b border-gray-200'
                : ''
              }`}
          >
            <button onClick={() => handleClickAuthor(comment.authorId)}>
              <div className="shrink-0">
                {comment.authorId && !authorInfoMap.has(comment.authorId) ? (
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                ) : (
                  <UserProfile
                    profileUrl={displayPhotoURL || ''}
                    profileName={displayName || ''}
                    imgSize={50}
                    sizeClass="w-12 h-12"
                    existName={false}
                    iconSize="text-lg"
                  />
                )}
              </div>
            </button>
            <div className="flex flex-col flex-1 gap-1 min-w-0">
              <CommentContainer
                commentData={
                  {
                    ...comment,
                    authorName: displayName,
                    authorPhotoURL: displayPhotoURL,
                  } as CommentData
                }
                postId={postId}
                postAuthorId={postAuthorId}
                collectionName={collectionName}
                isLoadingAuthorInfo={
                  comment.authorId
                    ? !authorInfoMap.has(comment.authorId)
                    : false
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
