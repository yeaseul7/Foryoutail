'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import type { ShelterAnimalItem } from '@/packages/type/postType';

export interface UseShelterLikeReturn {
  /** 현재 찜 여부 */
  isLiked: boolean;
  /** 처리 중 여부 (중복 클릭 방지) */
  isUpdating: boolean;
  /**
   * 찜 토글. 성공 시 `animal_likes` 집계 기준 변화량 반환(-1, 0, 1).
   * 실패·조기 종료 시 0.
   */
  handleLike: (e?: React.MouseEvent) => Promise<number>;
}

/**
 * 유기동물 찜(좋아요) 공통 훅.
 * - animal_likes(user_id, animal_id) 기반으로 현재 사용자의 좋아요 상태를 관리
 *
 * @param desertionNo 상세 페이지 라우팅/호환용 식별자
 * @param animalData 동물 정보. Supabase animals.id가 포함되어 있어야 함
 */
export function useShelterLike(
  desertionNo: string | undefined,
  animalData?: ShelterAnimalItem,
): UseShelterLikeReturn {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const animalId = (animalData?.id ?? '').trim();

  useEffect(() => {
    if (!animalId || !desertionNo || !user) {
      setIsLiked(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('animal_likes')
          .select('id')
          .eq('user_id', user.uid)
          .eq('animal_id', animalId)
          .limit(1);

        if (error) throw error;
        if (!cancelled) setIsLiked((data ?? []).length > 0);
      } catch {
        if (!cancelled) setIsLiked(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [animalId, desertionNo, user]);

  const handleLike = async (e?: React.MouseEvent): Promise<number> => {
    e?.stopPropagation();

    if (!user) {
      alert('로그인이 필요합니다.');
      return 0;
    }
    if (!desertionNo || !animalId || isUpdating) {
      if (!animalId && animalData) {
        alert('동물 ID가 없어 처리할 수 없습니다.');
      }
      return 0;
    }

    setIsUpdating(true);
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('animal_likes')
          .delete()
          .eq('user_id', user.uid)
          .eq('animal_id', animalId);

        if (error) throw error;
        setIsLiked(false);
        return -1;
      }

      const { error } = await supabase.from('animal_likes').insert({
        user_id: user.uid,
        animal_id: animalId,
      });

      if (error) throw error;
      setIsLiked(true);
      return 1;
    } catch (error) {
      console.error('찜 처리 실패:', error);
      alert('처리 중 오류가 발생했습니다.');
      return 0;
    } finally {
      setIsUpdating(false);
    }
  };

  return { isLiked, isUpdating, handleLike };
}
