import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

const CATEGORIES = new Set(['suggestion', 'bug', 'other']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUSES = new Set(['received', 'reviewing', 'completed']);

async function getRequester(request: Request) {
  const supabase = await createSupabaseAdminClient();
  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!accessToken) return { supabase, user: null, isAdmin: false };

  const { data: authData } = await supabase.auth.getUser(accessToken);
  if (!authData.user) return { supabase, user: null, isAdmin: false };
  const { data: profile } = await supabase
    .from('users')
    .select('fulladmin')
    .eq('id', authData.user.id)
    .maybeSingle();
  return { supabase, user: authData.user, isAdmin: profile?.fulladmin === true };
}

export async function GET(request: Request) {
  const requester = await getRequester(request);
  let query = requester.supabase
    .from('feedback')
    .select('id, user_id, category, content, contact_email, status, is_public, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!requester.isAdmin) {
    query = requester.user
      ? query.or(`is_public.eq.true,user_id.eq.${requester.user.id}`)
      : query.eq('is_public', true);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: '건의 목록을 불러오지 못했습니다.' }, { status: 500 });
  const items = (data ?? []).map((item) => ({
    ...item,
    contact_email: requester.isAdmin || item.user_id === requester.user?.id ? item.contact_email : null,
    user_id: requester.isAdmin || item.user_id === requester.user?.id ? item.user_id : null,
  }));
  return NextResponse.json({ items });
}

export async function PATCH(request: Request) {
  const admin = await getRequester(request);
  if (!admin.isAdmin) return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { id?: unknown; status?: unknown } | null;
  if (!body || typeof body.id !== 'string' || typeof body.status !== 'string' || !STATUSES.has(body.status)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from('feedback')
    .update({ status: body.status })
    .eq('id', body.id)
    .select('id, status')
    .single();
  if (error) return NextResponse.json({ error: '처리 상태를 변경하지 못했습니다.' }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    category?: unknown;
    content?: unknown;
    contactEmail?: unknown;
    isPublic?: unknown;
    website?: unknown;
  } | null;

  if (!body || typeof body.content !== 'string') {
    return NextResponse.json({ error: '건의 내용을 입력해주세요.' }, { status: 400 });
  }
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const content = body.content.trim();
  const category = typeof body.category === 'string' && CATEGORIES.has(body.category)
    ? body.category
    : 'suggestion';
  const contactEmail = typeof body.contactEmail === 'string' ? body.contactEmail.trim() : '';
  const isPublic = body.isPublic === true;

  if (content.length < 10 || content.length > 2000) {
    return NextResponse.json({ error: '건의 내용은 10자 이상 2,000자 이하로 입력해주세요.' }, { status: 400 });
  }
  if (contactEmail && (contactEmail.length > 254 || !EMAIL_PATTERN.test(contactEmail))) {
    return NextResponse.json({ error: '이메일 형식을 확인해주세요.' }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseAdminClient();
    const authorization = request.headers.get('authorization');
    const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
    const { data: authData } = accessToken
      ? await supabase.auth.getUser(accessToken)
      : { data: { user: null } };

    if (!isPublic && !authData.user) {
      return NextResponse.json({ error: '비공개 문의는 로그인 후 등록할 수 있습니다.' }, { status: 401 });
    }

    const { error } = await supabase.from('feedback').insert({
      user_id: authData.user?.id ?? null,
      category,
      content,
      contact_email: contactEmail || null,
      is_public: isPublic,
    });
    if (error) throw error;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('건의 저장 실패:', error);
    return NextResponse.json({ error: '건의를 접수하지 못했습니다.' }, { status: 500 });
  }
}
