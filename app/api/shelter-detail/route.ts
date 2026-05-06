import { NextRequest, NextResponse } from 'next/server';
import {
  createSupabaseAdminClient,
  getPublicUserById,
} from '@/lib/server/supabase-admin';

interface ShelterDetailRow {
  id: string;
  shelter_id: string;
  ntxt: string | null;
  created_at: string;
  updated_at: string;
}

interface UpdateShelterDetailBody {
  shelter_id?: string;
  ntxt?: string | null;
}

async function getAuthorizedFullAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;

  if (!token) {
    return { error: '인증 토큰이 없습니다.', status: 401 as const };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return { error: '인증에 실패했습니다.', status: 401 as const };
  }

  const publicUser = await getPublicUserById(user.id);
  if (publicUser?.fulladmin !== true) {
    return { error: '수정 권한이 없습니다.', status: 403 as const };
  }

  return { user, supabaseAdmin };
}

export async function GET(request: NextRequest) {
  try {
    const shelterId = request.nextUrl.searchParams.get('shelter_id')?.trim();

    if (!shelterId) {
      return NextResponse.json(
        { error: 'shelter_id는 필수입니다.' },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from('shelterdetail')
      .select('id, shelter_id, ntxt, created_at, updated_at')
      .eq('shelter_id', shelterId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const detail = ((data ?? [])[0] as ShelterDetailRow | undefined) ?? null;
    return NextResponse.json({ detail });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '보호소 소개 조회 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await getAuthorizedFullAdmin(request);
    if ('error' in authorized) {
      return NextResponse.json(
        { error: authorized.error },
        { status: authorized.status },
      );
    }

    const body = (await request.json()) as UpdateShelterDetailBody;
    const shelterId = body.shelter_id?.trim();
    const ntxt = body.ntxt?.trim() ?? '';

    if (!shelterId) {
      return NextResponse.json(
        { error: 'shelter_id는 필수입니다.' },
        { status: 400 },
      );
    }

    const { data: existingRows, error: existingError } = await authorized.supabaseAdmin
      .from('shelterdetail')
      .select('id')
      .eq('shelter_id', shelterId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 },
      );
    }

    const existingId = existingRows?.[0]?.id;

    if (existingId) {
      const { data, error } = await authorized.supabaseAdmin
        .from('shelterdetail')
        .update({ ntxt })
        .eq('id', existingId)
        .select('id, shelter_id, ntxt, created_at, updated_at')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, detail: data });
    }

    const { data, error } = await authorized.supabaseAdmin
      .from('shelterdetail')
      .insert({ shelter_id: shelterId, ntxt })
      .select('id, shelter_id, ntxt, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, detail: data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '보호소 소개 저장 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
