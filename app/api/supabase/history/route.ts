import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

type NotificationType = 'like' | 'comment' | 'reply';

interface CreateHistoryBody {
  receiverId?: string;
  actorId?: string;
  notificationType?: NotificationType;
  postId?: string | null;
  commentId?: string | null;
  replyId?: string | null;
}

interface UpdateHistoryBody {
  userId?: string;
  historyId?: string;
  markAll?: boolean;
}

interface DeleteHistoryBody {
  historyId?: string;
  receiverId?: string;
  actorId?: string;
  notificationType?: NotificationType;
  postId?: string | null;
  commentId?: string | null;
  replyId?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === 'true';
    const countOnly = request.nextUrl.searchParams.get('countOnly') === 'true';
    const limitCount = Number(request.nextUrl.searchParams.get('limitCount') || '5');

    if (!userId) {
      return NextResponse.json({ error: 'userId는 필수입니다.' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    let query = supabaseAdmin
      .from('notifications')
      .select(countOnly ? 'id' : 'id, receiver_id, actor_id, notification_type, post_id, comment_id, reply_id, is_read, created_at', {
        count: countOnly ? 'exact' : undefined,
      })
      .eq('receiver_id', userId);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (!countOnly) {
      query = query
        .order('created_at', { ascending: false })
        .limit(Number.isFinite(limitCount) ? limitCount : 5);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (countOnly) {
      return NextResponse.json({ count: count ?? 0 });
    }

    return NextResponse.json({ notifications: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '히스토리 조회 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateHistoryBody;

    if (!body.receiverId || !body.actorId || !body.notificationType) {
      return NextResponse.json(
        { error: 'receiverId, actorId, notificationType는 필수입니다.' },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin.from('notifications').insert({
      receiver_id: body.receiverId,
      actor_id: body.actorId,
      notification_type: body.notificationType,
      post_id: body.postId ?? null,
      comment_id: body.commentId ?? null,
      reply_id: body.replyId ?? null,
      is_read: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '히스토리 생성 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as UpdateHistoryBody;

    if (!body.userId) {
      return NextResponse.json({ error: 'userId는 필수입니다.' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    if (body.markAll) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('receiver_id', body.userId)
        .eq('is_read', false);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (!body.historyId) {
      return NextResponse.json({ error: 'historyId는 필수입니다.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', body.historyId)
      .eq('receiver_id', body.userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '히스토리 수정 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as DeleteHistoryBody;
    const supabaseAdmin = createSupabaseAdminClient();

    if (body.historyId) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', body.historyId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (!body.receiverId || !body.actorId || !body.notificationType || !body.postId) {
      return NextResponse.json(
        { error: '삭제 조건이 부족합니다.' },
        { status: 400 },
      );
    }

    let query = supabaseAdmin
      .from('notifications')
      .delete()
      .eq('receiver_id', body.receiverId)
      .eq('actor_id', body.actorId)
      .eq('notification_type', body.notificationType)
      .eq('post_id', body.postId);

    if (body.commentId) {
      query = query.eq('comment_id', body.commentId);
    }
    if (body.replyId) {
      query = query.eq('reply_id', body.replyId);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '히스토리 삭제 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
