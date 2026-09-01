import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const dynamic = 'force-dynamic';

export async function GET() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    try {
      const { env } = await getCloudflareContext({ async: true });
      const runtimeEnv = env as CloudflareEnv & {
        NEXT_PUBLIC_SUPABASE_URL?: string;
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
        NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      };
      supabaseUrl ||= runtimeEnv.NEXT_PUBLIC_SUPABASE_URL;
      supabasePublishableKey ||=
        runtimeEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } catch {
      // 로컬 Next.js에서는 Cloudflare context가 없습니다.
    }
  }

  if (
    !supabaseUrl ||
    !supabasePublishableKey ||
    supabasePublishableKey.startsWith('sb_secret_')
  ) {
    return NextResponse.json(
      { error: 'Supabase browser configuration is unavailable.' },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { supabaseUrl, supabasePublishableKey },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
