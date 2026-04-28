import { supabase } from '@/lib/supabase/client';
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
      { nickname?: string | null; photoURL?: string | null }
    >();

    if (uniqueActorIds.length > 0) {
      try {
        const response = await fetch(
          `/api/supabase/users/sync?ids=${encodeURIComponent(
            uniqueActorIds.join(','),
          )}`,
        );
        if (response.ok) {
          const body = (await response.json()) as {
            users?: Array<{
              id: string;
              nickname: string | null;
              profile_img: string | null;
            }>;
          };
          body.users?.forEach((user) => {
            userInfoMap.set(user.id, {
              nickname: user.nickname,
              photoURL: user.profile_img,
            });
          });
        }
      } catch (error) {
        console.error('Supabase 사용자 정보 가져오기 실패:', error);
      }
    }

    const postInfoMap = new Map<string, { title?: string }>();

    if (uniquePostIds.length > 0) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title')
          .in('id', uniquePostIds);

        if (error) {
          throw error;
        }

        (data ?? []).forEach((row) => {
          postInfoMap.set(row.id, {
            title: row.title ?? '',
          });
        });
      } catch (error) {
        console.error('게시물 제목 가져오기 실패:', error);
      }
    }

    return history.map((historyItem) => {
      const userData = userInfoMap.get(historyItem.actorId);
      const authorName =
        userData?.nickname || '존재하지 않는 사용자';
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
        createdAt: new Date(historyItem.createdAt),
        isRead: historyItem.isRead,
      };
    });
  } catch (error) {
    console.error('히스토리 매핑 실패:', error);
    return [];
  }
}
