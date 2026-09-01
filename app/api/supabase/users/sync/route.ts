import { NextRequest, NextResponse } from 'next/server';
import {
  getPublicUserById,
  getPublicUsersByIds,
  createSupabaseAdminClient,
  syncPublicUserByAuthIdentity,
} from '@/lib/server/supabase-admin';

interface SyncUserBody {
  nickname?: string | null;
  profile_img?: string | null;
}

async function authenticatedUser(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;

  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data.user;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SyncUserBody;
    const authUser = await authenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 },
      );
    }

    const user = await syncPublicUserByAuthIdentity({
      id: authUser.id,
      email: authUser.email ?? null,
      nickname: body.nickname ?? null,
      profile_img: body.profile_img ?? null,
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Supabase users 동기화 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const ids = request.nextUrl.searchParams.get('ids');

    if (ids !== null) {
      const parsedIds = ids
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      if (parsedIds.length === 0) {
        return NextResponse.json({ users: [] });
      }

      const usersMap = await getPublicUsersByIds(parsedIds);

      return NextResponse.json({
        users: Array.from(usersMap.values()),
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'id는 필수입니다.' },
        { status: 400 },
      );
    }

    const data = await getPublicUserById(id);

    return NextResponse.json({
      exists: Boolean(data?.id),
      hasCompletedProfile: Boolean(data?.nickname?.trim()),
      user: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Supabase users 조회 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
