import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth';

export interface UseFullAdminResult {
    /** public.users.fullAdmin 값 */
    fulladmin: boolean;
    /** 사용자 문서 로드 중 여부 */
    loading: boolean;
}

/**
 * 현재 로그인한 사용자의 fulladmin 여부를 반환합니다.
 * public.users의 fullAdmin 필드를 조회합니다.
 */
export function useFullAdmin(): UseFullAdminResult {
    const { user } = useAuth();
    const [fulladmin, setFulladmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!user?.uid) {
                setFulladmin(false);
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(
                    `/api/supabase/users/sync?id=${encodeURIComponent(user.uid)}`,
                    {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );
                if (!response.ok) {
                    throw new Error('fulladmin 조회 실패');
                }
                const body = (await response.json()) as {
                    user?: { fulladmin?: boolean | null } | null;
                };
                setFulladmin(body.user?.fulladmin === true);
            } catch {
                setFulladmin(false);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user?.uid]);

    return { fulladmin, loading };
}
