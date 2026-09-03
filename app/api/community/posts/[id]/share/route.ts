import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { id: slug } = await params;
  const supabase = await createSupabaseAdminClient();
  const { data: post, error: postError } = await supabase.from('posts').select('id').eq('slug', slug).maybeSingle();
  if (postError) return NextResponse.json({ error: postError.message }, { status: 500 });
  if (!post) return NextResponse.json({ error: 'post not found' }, { status: 404 });
  const { data, error } = await supabase.rpc('increment_post_share_count', {
    target_post_id: post.id,
  });

  if (error) {
    const status = error.message.includes('post not found') ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ shareCount: data });
}
