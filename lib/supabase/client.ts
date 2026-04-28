import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isSecretKey = supabasePublishableKey?.startsWith('sb_secret_') ?? false;

export const hasSupabaseConfig = Boolean(
  supabaseUrl && supabasePublishableKey && !isSecretKey,
);

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabasePublishableKey || 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export async function getSupabaseAccessToken(): Promise<string | null> {
  if (!hasSupabaseConfig) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export function assertValidSupabaseBrowserKey() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Supabase 환경변수가 없습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 설정해주세요.',
    );
  }

  if (isSecretKey) {
    throw new Error(
      '브라우저에서는 sb_secret 키를 사용할 수 없습니다. Supabase Dashboard의 publishable(또는 anon public) 키로 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 교체해주세요.',
    );
  }
}
