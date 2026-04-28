import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import type { CommentData, ReplyData } from '@/packages/type/commentType';
import type { SerializableTimestamp } from '@/packages/type/postType';

type CommentRow = {
  id: string;
  post_id: string | null;
  author_id: string | null;
  content: string;
  parent_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function toSerializableTimestamp(value: string | null): SerializableTimestamp | null {
  if (!value) return null;

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;

  return {
    seconds: Math.floor(time / 1000),
    nanoseconds: (time % 1000) * 1_000_000,
  };
}

export function mapCommentRow(row: CommentRow): CommentData {
  return {
    id: row.id,
    authorId: row.author_id ?? '',
    authorName: '',
    authorPhotoURL: '',
    content: row.content,
    createdAt: toSerializableTimestamp(row.created_at),
    likes: 0,
  };
}

export function mapReplyRow(row: CommentRow): ReplyData {
  return {
    id: row.id,
    authorId: row.author_id ?? '',
    content: row.content,
    createdAt: toSerializableTimestamp(row.created_at),
    likes: 0,
  };
}

export async function getCommentCountByPostId(postId: string): Promise<number> {
  if (!postId) return 0;

  const supabaseAdmin = createSupabaseAdminClient();
  const { count, error } = await supabaseAdmin
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
