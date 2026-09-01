'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  assertValidSupabaseBrowserKey,
  hasSupabaseConfig,
  supabase,
} from '@/lib/supabase/client';

export interface AppAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface RegisterResult {
  needsEmailConfirmation: boolean;
}

interface UpdateAuthProfileParams {
  displayName?: string | null;
  photoURL?: string | null;
}

interface SyncPublicUserParams {
  nickname: string | null;
  profile_img: string | null;
  accessToken: string;
}

interface AuthContextType {
  user: AppAuthUser | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  register: (email: string) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  loginWithKakao: () => Promise<void>;
  updateUserProfile: (params: UpdateAuthProfileParams) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => ({ needsEmailConfirmation: false }),
  logout: async () => {},
  loginWithGoogle: async () => {},
  loginWithGithub: async () => {},
  loginWithKakao: async () => {},
  updateUserProfile: async () => {},
});

function ensureSupabaseConfigured() {
  assertValidSupabaseBrowserKey();
}

function mapSupabaseUser(user: SupabaseUser | null): AppAuthUser | null {
  if (!user) return null;

  const metadata = user.user_metadata ?? {};
  const displayName =
    typeof metadata.displayName === 'string'
      ? metadata.displayName
      : typeof metadata.full_name === 'string'
        ? metadata.full_name
        : typeof metadata.name === 'string'
          ? metadata.name
          : null;

  const photoURL =
    typeof metadata.photoURL === 'string'
      ? metadata.photoURL
      : typeof metadata.avatar_url === 'string'
        ? metadata.avatar_url
        : typeof metadata.picture === 'string'
          ? metadata.picture
          : null;

  return {
    uid: user.id,
    email: user.email ?? null,
    displayName,
    photoURL,
  };
}

function getRedirectTo(path: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}${path}`;
}

async function syncSupabasePublicUser({
  nickname,
  profile_img,
  accessToken,
}: SyncPublicUserParams): Promise<void> {
  const response = await fetch('/api/supabase/users/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      nickname,
      profile_img,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error || 'Supabase users 동기화에 실패했습니다.');
  }
}

async function hasCompletedUserProfile(uid: string): Promise<boolean> {
  const response = await fetch(
    `/api/supabase/users/sync?id=${encodeURIComponent(uid)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error || 'Supabase users 조회에 실패했습니다.');
  }

  const body = (await response.json()) as { hasCompletedProfile?: boolean };
  return body.hasCompletedProfile === true;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AppAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const init = async () => {
      if (!hasSupabaseConfig) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const mappedUser = mapSupabaseUser(session?.user ?? null);

      if (active) {
        setUser(mappedUser);
        setLoading(false);
      }

      if (mappedUser) {
        void syncSupabasePublicUser({
          nickname: mappedUser.displayName,
          profile_img: mappedUser.photoURL,
          accessToken: session!.access_token,
        }).catch((error) => {
          console.error('Supabase public.users 초기 동기화 실패:', error);
        });
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const mappedUser = mapSupabaseUser(session?.user ?? null);
      setUser(mappedUser);
      setLoading(false);

      if (mappedUser) {
        void syncSupabasePublicUser({
          nickname: mappedUser.displayName,
          profile_img: mappedUser.photoURL,
          accessToken: session!.access_token,
        }).catch((error) => {
          console.error('Supabase public.users 자동 동기화 실패:', error);
        });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    let cancelled = false;

    const routeByProfile = async () => {
      try {
        const hasCompletedProfile = await hasCompletedUserProfile(user.uid);
        if (cancelled) return;

        if (!hasCompletedProfile && pathname !== '/register') {
          router.push('/register');
          return;
        }

        if (hasCompletedProfile && pathname === '/register') {
          router.push('/');
        }
      } catch (error) {
        console.error('사용자 프로필 확인 중 오류:', error);
      }
    };

    routeByProfile();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, user?.uid]);

  const login = async (email: string) => {
    ensureSupabaseConfigured();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getRedirectTo('/register'),
        shouldCreateUser: false,
      },
    });

    if (error) {
      throw error;
    }
  };

  const register = async (email: string): Promise<RegisterResult> => {
    ensureSupabaseConfigured();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getRedirectTo('/register'),
        shouldCreateUser: true,
      },
    });

    if (error) {
      throw error;
    }

    return {
      needsEmailConfirmation: true,
    };
  };

  const logout = async () => {
    ensureSupabaseConfigured();

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const signInWithOAuthProvider = async (
    provider: 'google' | 'github' | 'kakao',
  ) => {
    ensureSupabaseConfigured();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getRedirectTo('/register'),
      },
    });

    if (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => signInWithOAuthProvider('google');
  const loginWithGithub = async () => signInWithOAuthProvider('github');
  const loginWithKakao = async () => signInWithOAuthProvider('kakao');

  const updateUserProfile = async ({
    displayName,
    photoURL,
  }: UpdateAuthProfileParams) => {
    ensureSupabaseConfigured();

    const { error } = await supabase.auth.updateUser({
      data: {
        ...(displayName !== undefined
          ? { displayName, full_name: displayName }
          : {}),
        ...(photoURL !== undefined
          ? { photoURL, avatar_url: photoURL, picture: photoURL }
          : {}),
      },
    });

    if (error) {
      throw error;
    }

    const {
      data: { user: updatedUser },
    } = await supabase.auth.getUser();
    const mappedUser = mapSupabaseUser(updatedUser);

    if (mappedUser) {
      setUser(mappedUser);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('인증 세션이 없습니다.');
      await syncSupabasePublicUser({
        nickname: mappedUser.displayName,
        profile_img: mappedUser.photoURL,
        accessToken: session.access_token,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
        loginWithGithub,
        loginWithKakao,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
