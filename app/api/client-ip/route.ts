import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * 클라이언트 IP를 반환합니다.
 * 조회수 중복 방지 등에 사용됩니다.
 */
export async function GET(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() ?? realIp ?? '';
  return NextResponse.json({ ip: ip || 'unknown' });
}
