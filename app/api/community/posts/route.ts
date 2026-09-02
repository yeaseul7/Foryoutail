import { NextRequest, NextResponse } from 'next/server';
import { getCommunityFeedPage } from '@/lib/server/community-posts';

export async function GET(request: NextRequest) {
  try {
    const page = await getCommunityFeedPage(request.nextUrl.searchParams.get('cursor'));
    return NextResponse.json(page, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('Community posts API error:', error);
    return NextResponse.json({ error: '게시글을 불러오지 못했습니다.' }, { status: 500 });
  }
}
