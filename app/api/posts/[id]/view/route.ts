import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabaseAdmin = createSupabaseAdminClient();

    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, view_count')
      .eq('id', id)
      .maybeSingle();

    if (postError) {
      return NextResponse.json(
        { error: postError.message },
        { status: 500 },
      );
    }

    if (!post) {
      return NextResponse.json(
        { error: '게시물을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('posts')
      .update({
        view_count: (post.view_count ?? 0) + 1,
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('조회수 증가 실패:', error);
    return NextResponse.json(
      { error: '조회수 증가 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
