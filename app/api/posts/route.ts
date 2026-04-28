import { NextRequest, NextResponse } from 'next/server';
import { getAllBoardsData } from '@/lib/domain/community/post';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = Number(limitParam);
    const posts = await getAllBoardsData(
      Number.isFinite(limit) && limit > 0 ? limit : 60,
    );

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('게시물 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '게시물 목록 조회에 실패했습니다.' },
      { status: 500 },
    );
  }
}
