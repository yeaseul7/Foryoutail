import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import { MappedHistoryData } from '@/packages/type/history';
import { getHistoryRecent } from '@/lib/domain/community/history';

/**
 * 히스토리를 조회하고 사용자 정보와 게시물 정보를 매핑
 * @param userId 사용자 ID
 * @returns 매핑된 히스토리 배열
 */
export async function getAndMappingHistoryToCommentData(
  userId: string,
): Promise<MappedHistoryData[]> {
  try {
    const history = await getHistoryRecent(userId);
    if (!history || history.length === 0) {
      return [];
    }

    const uniqueActorIds = [...new Set(history.map((h) => h.actorId))];
    const uniquePostIds = [...new Set(history.map((h) => h.postId))];

    const userInfoMap = new Map<
      string,
      { displayName?: string; nickname?: string; photoURL?: string }
    >();

    await Promise.all(
      uniqueActorIds.map(async (actorId) => {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', actorId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userInfoMap.set(actorId, {
              displayName: userData?.displayName,
              nickname: userData?.nickname,
              photoURL: userData?.photoURL,
            });
          }
        } catch (error) {
          console.error(`사용자 ${actorId} 정보 가져오기 실패:`, error);
        }
      }),
    );

    const postInfoMap = new Map<string, { title?: string }>();

    await Promise.all(
      uniquePostIds.map(async (postId) => {
        try {
          const postDoc = await getDoc(doc(firestore, 'boards', postId));
          if (postDoc.exists()) {
            const postData = postDoc.data();
            postInfoMap.set(postId, {
              title: postData?.title,
            });
          }
        } catch (error) {
          console.error(`게시물 ${postId} 정보 가져오기 실패:`, error);
        }
      }),
    );

    return history.map((historyItem) => {
      const userData = userInfoMap.get(historyItem.actorId);
      const authorName =
        userData?.displayName || userData?.nickname || '존재하지 않는 사용자';
      const authorPhotoURL = userData?.photoURL || '';

      const actionType =
        historyItem.action === 'like'
          ? '좋아요를'
          : historyItem.action === 'comment'
          ? '댓글을'
          : '대댓글을';

      const postData = postInfoMap.get(historyItem.postId);
      const postTitle = postData?.title || '삭제된 게시물';

      return {
        value: `${authorName}님이 ${postTitle}에 ${actionType} 남겼습니다.`,
        authorPhotoURL,
        authorName,
        title: postTitle,
        historyId: historyItem.id,
        postId: historyItem.postId,
        action: historyItem.action,
        actionType,
        createdAt: historyItem.createdAt.toDate(),
        isRead: historyItem.isRead,
      };
    });
  } catch (error) {
    console.error('히스토리 매핑 실패:', error);
    return [];
  }
}
