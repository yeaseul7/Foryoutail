import { supabase } from '@/lib/supabase/client';

export type HistoryAction = 'like' | 'comment' | 'reply';
export type HistoryTargetType = 'post' | 'comment' | 'reply';

export interface HistoryDataWithId {
  id: string;
  actorId: string;
  postId: string;
  commentId?: string;
  replyId?: string;
  action: HistoryAction;
  isRead: boolean;
  createdAt: string;
}

interface NotificationRow {
  id: string;
  actor_id: string | null;
  notification_type: string;
  post_id: string | null;
  comment_id: string | null;
  reply_id?: string | null;
  is_read: boolean | null;
  created_at: string | null;
}

async function requestHistory<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error || '히스토리 요청에 실패했습니다.');
  }
  return response.json() as Promise<T>;
}

function mapNotificationRow(row: NotificationRow): HistoryDataWithId {
  const action = (row.notification_type || 'comment') as HistoryAction;
  return {
    id: row.id,
    actorId: row.actor_id || '',
    postId: row.post_id || '',
    commentId: row.comment_id || undefined,
    replyId: row.reply_id || undefined,
    action,
    isRead: row.is_read === true,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function createHistory(
  targetUserId: string,
  actorId: string,
  action: HistoryAction,
  _targetType: HistoryTargetType,
  _targetId: string,
  postId: string,
  commentId?: string,
  replyId?: string,
): Promise<void> {
  void _targetType;
  void _targetId;
  if (targetUserId === actorId) {
    return;
  }

  try {
    await requestHistory<{ ok: true }>('/api/supabase/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiverId: targetUserId,
        actorId,
        notificationType: action,
        postId,
        commentId: commentId ?? null,
        replyId: replyId ?? null,
      }),
    });
  } catch (error) {
    console.error('히스토리 생성 실패:', error);
  }
}

export async function markHistoryAsRead(
  userId: string,
  historyId: string,
): Promise<void> {
  try {
    await requestHistory<{ ok: true }>('/api/supabase/history', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        historyId,
      }),
    });
  } catch (error) {
    console.error('히스토리 읽음 표시 실패:', error);
  }
}

export async function getHistory(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limitCount?: number;
  },
): Promise<HistoryDataWithId[]> {
  try {
    const query = new URLSearchParams({
      userId,
      unreadOnly: options?.unreadOnly ? 'true' : 'false',
      limitCount: String(options?.limitCount ?? 20),
    });
    const result = await requestHistory<{ notifications: NotificationRow[] }>(
      `/api/supabase/history?${query.toString()}`,
    );
    return (result.notifications ?? []).map(mapNotificationRow);
  } catch (error) {
    console.error('히스토리 조회 실패:', error);
    return [];
  }
}

export async function getHistoryRecent(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limitCount?: number;
  },
): Promise<HistoryDataWithId[]> {
  return getHistory(userId, {
    unreadOnly: options?.unreadOnly,
    limitCount: options?.limitCount ?? 5,
  });
}

export async function getUnreadHistoryCount(userId: string): Promise<number> {
  try {
    const query = new URLSearchParams({
      userId,
      unreadOnly: 'true',
      countOnly: 'true',
    });
    const result = await requestHistory<{ count: number }>(
      `/api/supabase/history?${query.toString()}`,
    );
    return result.count ?? 0;
  } catch (error) {
    console.error('읽지 않은 히스토리 개수 조회 실패:', error);
    return 0;
  }
}

export async function markAllHistoryAsRead(userId: string): Promise<void> {
  try {
    await requestHistory<{ ok: true }>('/api/supabase/history', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        markAll: true,
      }),
    });
  } catch (error) {
    console.error('모든 히스토리 읽음 표시 실패:', error);
  }
}

export async function deleteHistory(
  _userId: string,
  historyId: string,
): Promise<void> {
  try {
    await requestHistory<{ ok: true }>('/api/supabase/history', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ historyId }),
    });
  } catch (error) {
    console.error('히스토리 삭제 실패:', error);
  }
}

export async function deleteHistoryByPostLike(
  postId: string,
  actorId: string,
): Promise<void> {
  try {
    const { data: postData, error } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .maybeSingle();

    if (error || !postData) return;

    const postAuthorId = postData.author_id;
    if (!postAuthorId) return;

    await requestHistory<{ ok: true }>('/api/supabase/history', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiverId: postAuthorId,
        actorId,
        notificationType: 'like',
        postId,
      }),
    });
  } catch (error) {
    console.error('게시물 좋아요 히스토리 삭제 실패:', error);
  }
}

export async function deleteHistoryByCommentLike(
  commentId: string,
  postId: string,
  actorId: string,
): Promise<void> {
  try {
    const { data: commentData, error } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', commentId)
      .eq('post_id', postId)
      .maybeSingle();

    if (error || !commentData) return;

    const commentAuthorId = commentData.author_id;
    if (!commentAuthorId) return;

    await requestHistory<{ ok: true }>('/api/supabase/history', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiverId: commentAuthorId,
        actorId,
        notificationType: 'like',
        postId,
        commentId,
      }),
    });
  } catch (error) {
    console.error('댓글 좋아요 히스토리 삭제 실패:', error);
  }
}

export async function deleteHistoryByCommentId(
  commentId: string,
  postId: string,
  authorId: string,
): Promise<void> {
  try {
    const { data: postData, error } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .maybeSingle();

    if (error || !postData) return;

    const postAuthorId = postData.author_id;
    if (!postAuthorId) return;

    await requestHistory<{ ok: true }>('/api/supabase/history', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiverId: postAuthorId,
        actorId: authorId,
        notificationType: 'comment',
        postId,
        commentId,
      }),
    });
  } catch (error) {
    console.error('댓글 관련 히스토리 삭제 실패:', error);
  }
}

export async function deleteHistoryByReplyId(
  replyId: string,
  postId: string,
  commentId: string,
  authorId: string,
): Promise<void> {
  try {
    const { data: commentData, error } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', commentId)
      .eq('post_id', postId)
      .maybeSingle();

    if (error || !commentData) return;

    const commentAuthorId = commentData.author_id;
    if (!commentAuthorId) return;

    await requestHistory<{ ok: true }>('/api/supabase/history', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiverId: commentAuthorId,
        actorId: authorId,
        notificationType: 'reply',
        postId,
        commentId,
        replyId,
      }),
    });
  } catch (error) {
    console.error('대댓글 관련 히스토리 삭제 실패:', error);
  }
}
