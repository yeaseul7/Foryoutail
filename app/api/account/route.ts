import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

export async function DELETE(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!accessToken) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  try {
    const supabaseAdmin = await createSupabaseAdminClient();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !user) return NextResponse.json({ error: '유효하지 않은 인증입니다.' }, { status: 401 });

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('회원 탈퇴 실패:', error);
    return NextResponse.json({ error: '회원 탈퇴에 실패했습니다.' }, { status: 500 });
  }
}
