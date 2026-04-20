import { PostData } from '@/packages/type/postType';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/firebase/auth';
import UserProfile from '../../common/UserProfile';
import { formatDateSimple } from '@/packages/utils/dateFormatting';

export default function ReadHeader({
  post,
  isEditing,
}: {
  post: PostData | null;
  isEditing: boolean;
}) {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [authorNickname, setAuthorNickname] = useState<string>('');
  const [authorPhotoURL, setAuthorPhotoURL] = useState<string | null>(null);

  const postId = params.id as string;

  // 작성자 정보를 Firestore의 users 컬렉션에서 가져오기
  useEffect(() => {
    const fetchAuthorInfo = async () => {
      if (!post?.authorId) {
        setAuthorNickname('');
        setAuthorPhotoURL(null);
        return;
      }

      try {
        const userDoc = await getDoc(doc(firestore, 'users', post.authorId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setAuthorNickname(
            userData?.nickname ||
              userData?.displayName ||
              post?.authorName ||
              '탈퇴한 사용자',
          );
          setAuthorPhotoURL(userData?.photoURL || null);
        } else {
          setAuthorNickname(post?.authorName || '탈퇴한 사용자');
          setAuthorPhotoURL(post?.authorPhotoURL || null);
        }
      } catch (error) {
        console.error('작성자 정보 가져오기 실패:', error);
        setAuthorNickname(post?.authorName || '탈퇴한 사용자');
        setAuthorPhotoURL(post?.authorPhotoURL || null);
      }
    };

    fetchAuthorInfo();
  }, [post?.authorId, post?.authorName, post?.authorPhotoURL]);

  const handleEdit = useCallback(() => {
    router.push(`/edit/${postId}`);
  }, [router, postId]);

  const handleDelete = useCallback(async () => {
    if (!user) {
      alert('게시물을 삭제하려면 로그인이 필요합니다.');
      return;
    }

    if (!post) {
      alert('게시물 정보를 불러올 수 없습니다.');
      return;
    }

    if (post.authorId !== user.uid) {
      alert('본인이 작성한 게시물만 삭제할 수 있습니다.');
      return;
    }

    const confirmed = window.confirm('게시물을 삭제하시겠습니까?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(firestore, 'boards', postId));
      alert('게시물이 성공적으로 삭제되었습니다.');
      router.push('/');
    } catch (e) {
      console.error('게시물 삭제 중 오류 발생:', e);

      const error = e as { code?: string; message?: string };
      if (error.code === 'permission-denied') {
        alert(
          '권한이 없습니다. Firestore 보안 규칙을 확인해주세요.\n\n' +
            'Firebase 콘솔 > Firestore Database > 규칙에서 boards 컬렉션에 대한 삭제 권한이 설정되어 있는지 확인하세요.',
        );
      } else {
        alert(
          `게시물 삭제 중 오류가 발생했습니다: ${
            error.message || '알 수 없는 오류'
          }`,
        );
      }
    }
  }, [router, postId, user, post]);

  return (
    <header className="mb-6">
      <h1 className="mb-4 text-xl font-bold sm:text-2xl lg:text-3xl">{post?.title}</h1>

      <div className="flex gap-4 justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <button onClick={() => router.push(`/posts/${post?.authorId}`)}>
            <UserProfile
              profileUrl={authorPhotoURL || ''}
              profileName={authorNickname || ''}
              imgSize={28}
              sizeClass="w-7 h-7"
              existName={false}
              iconSize="text-lg"
            />
          </button>
          <div className="flex gap-2 items-center">
            <div className="pr-2 text-base font-semibold">
              {authorNickname || post?.authorName || '탈퇴한 사용자'}
            </div>
            {post?.createdAt && (
              <div className="text-sm text-gray-500">
                {formatDateSimple(post.createdAt)}
              </div>
            )}
          </div>
        </div>
        {post?.authorId === user?.uid && (
          <div className="flex gap-1 items-center">
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="px-2 py-1 text-gray-500 whitespace-nowrap transition-colors cursor-pointer shrink-0 hover:text-gray-900"
              >
                수정
              </button>
            )}
            <button
              onClick={handleDelete}
              className="px-2 py-1 text-gray-500 whitespace-nowrap transition-colors cursor-pointer shrink-0 hover:text-gray-900"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {post?.tags && post?.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post?.tags.map((tag) => (
            <span
              key={tag}
              className="shrink-0 cursor-pointer whitespace-nowrap rounded-full bg-element2 px-2 py-1 text-sm text-primary1"
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
