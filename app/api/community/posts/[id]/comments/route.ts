import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id: postId } = await params;
  const supabase = await createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('comments')
    .select('id, author_id, content, deleted_at, like_count, created_at')
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const comments = data ?? [];
  const authorIds = [...new Set(comments.map((comment) => comment.author_id).filter(Boolean))];
  const authors = new Map<string, { nickname: string | null; profile_img: string | null }>();

  if (authorIds.length) {
    const { data: authorData, error: authorError } = await supabase
      .from('users')
      .select('id, nickname, profile_img')
      .in('id', authorIds);
    if (authorError) return NextResponse.json({ error: authorError.message }, { status: 500 });
    for (const author of authorData ?? []) authors.set(author.id, author);
  }

  return NextResponse.json({
    comments: comments.map((comment) => ({
      ...comment,
      authorName: authors.get(comment.author_id)?.nickname ?? null,
      authorImageUrl: authors.get(comment.author_id)?.profile_img ?? null,
    })),
  });
}
