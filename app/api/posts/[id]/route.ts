import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 없습니다.' },
        { status: 401 },
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 },
      );
    }

    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, author_id')
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

    if (post.author_id !== user.id) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 },
      );
    }

    const { error: commentsDeleteError } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('post_id', id);

    if (commentsDeleteError) {
      return NextResponse.json(
        { error: commentsDeleteError.message },
        { status: 500 },
      );
    }

    const { error: postDeleteError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id);

    if (postDeleteError) {
      return NextResponse.json(
        { error: postDeleteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('게시물 삭제 실패:', error);
    return NextResponse.json(
      { error: '게시물 삭제 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
