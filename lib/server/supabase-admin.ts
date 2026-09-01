import { createClient } from '@supabase/supabase-js';

export interface PublicUserProfile {
  id: string;
  email: string | null;
  nickname: string | null;
  profile_img: string | null;
  fulladmin?: boolean | null;
  created_at?: string | null;
}

interface SyncPublicUserInput {
  id: string;
  email: string | null;
  nickname?: string | null;
  profile_img?: string | null;
}

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.',
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getPublicUserById(
  id: string,
): Promise<PublicUserProfile | null> {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, nickname, profile_img, fulladmin, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getPublicUsersByIds(
  ids: string[],
): Promise<Map<string, PublicUserProfile>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, nickname, profile_img, fulladmin, created_at')
    .in('id', uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((row) => [row.id, row]));
}

export async function syncPublicUserByAuthIdentity({
  id,
  email,
  nickname = null,
  profile_img = null,
}: SyncPublicUserInput): Promise<PublicUserProfile> {
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: upserted, error: upsertError } = await supabaseAdmin
    .from('users')
    .upsert(
      {
        id,
        email,
        nickname,
        profile_img,
      },
      { onConflict: 'id' },
    )
    .select('id, email, nickname, profile_img, fulladmin, created_at')
    .single();

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return upserted;
}
