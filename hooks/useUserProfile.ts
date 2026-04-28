import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth';

interface UserProfileData {
  photoURL: string | null;
  nickname: string;
  loading: boolean;
  error: Error | null;
}

/**
 * 사용자 프로필 정보를 가져오는 커스텀 훅
 * @param userId - 가져올 사용자의 uid (없으면 현재 로그인한 사용자)
 * @param fallbackName - Firestore에 데이터가 없을 때 사용할 기본 이름
 * @param fallbackPhotoURL - Firestore에 데이터가 없을 때 사용할 기본 프로필 이미지 URL
 * @returns UserProfileData - photoURL, nickname, loading, error
 */
export function useUserProfile(
  userId?: string | null,
  fallbackName?: string,
  fallbackPhotoURL?: string | null,
): UserProfileData {
  const { user } = useAuth();
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      // userId가 없으면 현재 로그인한 사용자 사용
      const targetUserId = userId || user?.uid;

      if (!targetUserId) {
        setPhotoURL(fallbackPhotoURL || null);
        setNickname(fallbackName || '');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/supabase/users/sync?id=${encodeURIComponent(targetUserId)}`,
        );
        if (!response.ok) {
          throw new Error('사용자 조회에 실패했습니다.');
        }
        const userData = (await response.json()) as {
          exists?: boolean;
          user?: {
            id: string;
            email: string | null;
            nickname: string | null;
            profile_img: string | null;
          } | null;
        };
        if (userData.user) {
          setPhotoURL(userData.user.profile_img || null);
          setNickname(
            userData.user.nickname ||
              (targetUserId === user?.uid ? user.displayName : null) ||
              fallbackName ||
              '탈퇴한 사용자',
          );
        } else {
          // Firestore에 데이터가 없으면 Firebase Auth 정보 또는 fallback 사용
          if (targetUserId === user?.uid) {
            setPhotoURL(user.photoURL || fallbackPhotoURL || null);
            setNickname(user.displayName || fallbackName || 'User');
          } else {
            setPhotoURL(fallbackPhotoURL || null);
            setNickname(fallbackName || '탈퇴한 사용자');
          }
        }
      } catch (err) {
        console.error('사용자 프로필 가져오기 실패:', err);
        setError(err instanceof Error ? err : new Error('알 수 없는 오류'));
        // 에러 발생 시 fallback 사용
        if (targetUserId === user?.uid) {
          setPhotoURL(user.photoURL || fallbackPhotoURL || null);
          setNickname(user.displayName || fallbackName || 'User');
        } else {
          setPhotoURL(fallbackPhotoURL || null);
          setNickname(fallbackName || '탈퇴한 사용자');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, user, fallbackName, fallbackPhotoURL]);

  return { photoURL, nickname, loading, error };
}

/**
 * 여러 사용자의 프로필 정보를 한 번에 가져오는 커스텀 훅
 * @param userIds - 가져올 사용자들의 uid 배열
 * @returns Map<string, { nickname: string; photoURL: string | null }> - userId를 키로 하는 프로필 정보 맵
 */
export function useUserProfiles(
  userIds: (string | null | undefined)[],
): Map<string, { nickname: string; photoURL: string | null }> {
  const { user } = useAuth();
  const [authorInfoMap, setAuthorInfoMap] = useState<
    Map<string, { nickname: string; photoURL: string | null }>
  >(new Map());

  useEffect(() => {
    const fetchAuthorInfo = async () => {
      const uniqueAuthorIds = [
        ...new Set(
          userIds
            .filter((id): id is string => typeof id === 'string')
            .map((id) => id.trim())
            .filter(Boolean),
        ),
      ];

      if (uniqueAuthorIds.length === 0) return;

      const authorIdsToFetch = uniqueAuthorIds.filter(
        (authorId) => !authorInfoMap.has(authorId),
      );

      if (authorIdsToFetch.length === 0) return;

      try {
        const response = await fetch(
          `/api/supabase/users/sync?ids=${encodeURIComponent(
            authorIdsToFetch.join(','),
          )}`,
        );
        if (!response.ok) {
          throw new Error('사용자 목록 조회에 실패했습니다.');
        }

        const result = (await response.json()) as {
          users?: Array<{
            id: string;
            nickname: string | null;
            profile_img: string | null;
          }>;
        };

        const nextMap = new Map(authorInfoMap);
        const fetchedMap = new Map(
          (result.users ?? []).map((item) => [item.id, item]),
        );

        authorIdsToFetch.forEach((authorId) => {
          const fetched = fetchedMap.get(authorId);
          if (fetched) {
            nextMap.set(authorId, {
              nickname:
                fetched.nickname ||
                (authorId === user?.uid ? user.displayName : null) ||
                '탈퇴한 사용자',
              photoURL: fetched.profile_img || null,
            });
            return;
          }

          if (authorId === user?.uid) {
            nextMap.set(authorId, {
              nickname: user.displayName || 'User',
              photoURL: user.photoURL || null,
            });
            return;
          }

          nextMap.set(authorId, {
            nickname: '탈퇴한 사용자',
            photoURL: null,
          });
        });

        setAuthorInfoMap(nextMap);
      } catch (error) {
        console.error('작성자 정보 일괄 가져오기 실패:', error);
      }
    };

    fetchAuthorInfo();
  }, [authorInfoMap, userIds, user]);

  return authorInfoMap;
}
