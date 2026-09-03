'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import type { ShelterAnimalItem } from '@/packages/type/postType';
import { useLanguage } from '@/lib/i18n/language';
import { trackEvent } from '@/lib/analytics';

type LikeListener = (isLiked: boolean) => void;

interface UserLikeBatch {
  values: Map<string, boolean>;
  pendingIds: Set<string>;
  listeners: Map<string, Set<LikeListener>>;
  timer: ReturnType<typeof setTimeout> | null;
}

const likeBatches = new Map<string, UserLikeBatch>();

function getLikeBatch(userId: string): UserLikeBatch {
  const existing = likeBatches.get(userId);
  if (existing) return existing;

  const created: UserLikeBatch = {
    values: new Map(),
    pendingIds: new Set(),
    listeners: new Map(),
    timer: null,
  };
  likeBatches.set(userId, created);
  return created;
}

function publishLikeValue(
  batch: UserLikeBatch,
  animalId: string,
  isLiked: boolean,
) {
  batch.values.set(animalId, isLiked);
  batch.listeners.get(animalId)?.forEach((listener) => listener(isLiked));
}

function scheduleLikeBatch(userId: string) {
  const batch = getLikeBatch(userId);
  if (batch.timer) return;

  batch.timer = setTimeout(async () => {
    batch.timer = null;
    const animalIds = [...batch.pendingIds];
    batch.pendingIds.clear();
    if (animalIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('animal_likes')
        .select('animal_id')
        .eq('user_id', userId)
        .in('animal_id', animalIds);

      if (error) throw error;
      const likedIds = new Set(
        (data ?? [])
          .map((row) => String(row.animal_id ?? '').trim())
          .filter(Boolean),
      );
      animalIds.forEach((animalId) => {
        publishLikeValue(batch, animalId, likedIds.has(animalId));
      });
    } catch {
      animalIds.forEach((animalId) => {
        publishLikeValue(batch, animalId, false);
      });
    }
  }, 0);
}

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
  const { t } = useLanguage();
  const [isLiked, setIsLiked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const animalId = (animalData?.id ?? '').trim();

  useEffect(() => {
    if (!animalId || !desertionNo || !user) {
      setIsLiked(false);
      return;
    }

    const batch = getLikeBatch(user.uid);
    const listener: LikeListener = (nextIsLiked) => setIsLiked(nextIsLiked);
    const listeners = batch.listeners.get(animalId) ?? new Set<LikeListener>();
    listeners.add(listener);
    batch.listeners.set(animalId, listeners);

    const cached = batch.values.get(animalId);
    if (cached !== undefined) {
      setIsLiked(cached);
    } else {
      batch.pendingIds.add(animalId);
      scheduleLikeBatch(user.uid);
    }

    return () => {
      const currentListeners = batch.listeners.get(animalId);
      currentListeners?.delete(listener);
      if (currentListeners?.size === 0) {
        batch.listeners.delete(animalId);
      }
    };
  }, [animalId, desertionNo, user]);

  const handleLike = async (e?: React.MouseEvent): Promise<number> => {
    e?.stopPropagation();

    if (!user) {
      alert(t('로그인이 필요합니다.', 'You need to sign in.'));
      return 0;
    }
    if (!desertionNo || !animalId || isUpdating) {
      if (!animalId && animalData) {
        alert(t('동물 ID가 없어 처리할 수 없습니다.', 'This animal does not have a valid ID.'));
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
        publishLikeValue(getLikeBatch(user.uid), animalId, false);
        return -1;
      }

      const { error } = await supabase.from('animal_likes').insert({
        user_id: user.uid,
        animal_id: animalId,
      });

      if (error) throw error;
      publishLikeValue(getLikeBatch(user.uid), animalId, true);
      trackEvent('save_animal', {
        animal_id: animalId,
        animal_type: animalData?.upKindCd ?? animalData?.upKindNm,
      });
      return 1;
    } catch (error) {
      console.error('찜 처리 실패:', error);
      alert(t('처리 중 오류가 발생했습니다.', 'An error occurred while processing your request.'));
      return 0;
    } finally {
      setIsUpdating(false);
    }
  };

  return { isLiked, isUpdating, handleLike };
}
