import { NextRequest, NextResponse } from 'next/server';
import {
  getPublicUserById,
  getPublicUsersByIds,
  syncPublicUserByEmailAwareUpsert,
} from '@/lib/server/supabase-admin';

interface SyncUserBody {
  id?: string;
  email?: string | null;
  nickname?: string | null;
  profile_img?: string | null;
  fulladmin?: boolean | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SyncUserBody;

    if (!body.id) {
      return NextResponse.json(
        { error: 'id는 필수입니다.' },
        { status: 400 },
      );
    }

    const user = await syncPublicUserByEmailAwareUpsert({
      id: body.id,
      email: body.email ?? null,
      nickname: body.nickname ?? null,
      profile_img: body.profile_img ?? null,
      fulladmin: typeof body.fulladmin === 'boolean' ? body.fulladmin : null,
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
