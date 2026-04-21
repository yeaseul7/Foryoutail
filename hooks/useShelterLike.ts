'use client';

import { useEffect, useState } from 'react';
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/firebase/auth';
import type { ShelterAnimalItem } from '@/packages/type/postType';

const LIKED_ANIMALS_COLLECTION = 'likedAnimals';

function sanitizeForFirestore(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function buildAbandonmentPayload(
  animalData: ShelterAnimalItem | undefined,
): Record<string, unknown> {
  let firstImage: string | undefined;
  if (animalData) {
    for (let i = 1; i <= 8; i++) {
      const popfile = animalData[`popfile${i}` as keyof ShelterAnimalItem] as
        | string
        | undefined;
      if (popfile && typeof popfile === 'string' && popfile.trim() !== '') {
        firstImage = popfile;
        break;
      }
    }
  }
  return sanitizeForFirestore({
    ...(animalData as Record<string, unknown>),
    image: firstImage ?? null,
    createdAt: serverTimestamp(),
  });
}

/** likedAnimals 문서 본문(집계 필드 제외, 유기번호 명시) */
function buildLikedAnimalBase(animalData: ShelterAnimalItem, desertionNo: string) {
  const metaKeys = new Set([
    'likedUserID',
    'likedCount',
    'likeCount',
    'updatedAt',
  ]);
  const raw = { ...animalData, desertionNo } as Record<string, unknown>;
  const stripped: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (metaKeys.has(k)) continue;
    stripped[k] = v;
  }
  return sanitizeForFirestore(stripped);
}

export interface UseShelterLikeReturn {
  /** 현재 찜 여부 */
  isLiked: boolean;
  /** 처리 중 여부 (중복 클릭 방지) */
  isUpdating: boolean;
  /**
   * 찜 토글. 성공 시 Firestore `likedAnimals` 집계 기준 변화량 반환(-1, 0, 1).
   * 실패·조기 종료 시 0.
   */
  handleLike: (e?: React.MouseEvent) => Promise<number>;
}

/**
 * 유기동물 찜(좋아요) 공통 훅.
 * - users/{userId}/abandonment/{desertionNo} (개인 찜)
 * - likedAnimals/{desertionNo} (전역 집계: likedUserID[], likedCount, processState 갱신)
 *
 * @param desertionNo 유기번호
 * @param animalData 저장할 동물 정보 (없으면 찜 저장·집계 반영 생략)
 */
export function useShelterLike(
  desertionNo: string | undefined,
  animalData?: ShelterAnimalItem,
): UseShelterLikeReturn {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!desertionNo || !user) {
      setIsLiked(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const ref = doc(firestore, 'users', user.uid, 'abandonment', desertionNo);
        const snap = await getDoc(ref);
        if (!cancelled) setIsLiked(snap.exists());
      } catch {
        if (!cancelled) setIsLiked(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [desertionNo, user]);

  const handleLike = async (e?: React.MouseEvent): Promise<number> => {
    e?.stopPropagation();

    if (!user) {
      alert('로그인이 필요합니다.');
      return 0;
    }
    if (!desertionNo || isUpdating) return 0;

    setIsUpdating(true);
    try {
      const abRef = doc(firestore, 'users', user.uid, 'abandonment', desertionNo);
      const likedRef = doc(firestore, LIKED_ANIMALS_COLLECTION, desertionNo);

      if (isLiked) {
        let countDelta = 0;
        await runTransaction(firestore, async (transaction) => {
          const likedSnap = await transaction.get(likedRef);

          if (!likedSnap.exists()) {
            transaction.delete(abRef);
            return;
          }

          const data = likedSnap.data() as Record<string, unknown>;
          const likedIds = (data.likedUserID as string[] | undefined) ?? [];
          if (!likedIds.includes(user.uid)) {
            transaction.delete(abRef);
            return;
          }

          transaction.delete(abRef);

          const nextIds = likedIds.filter((id) => id !== user.uid);
          if (nextIds.length === 0) {
            transaction.delete(likedRef);
            countDelta = -1;
            return;
          }

          transaction.update(likedRef, {
            likedUserID: arrayRemove(user.uid),
            likedCount: increment(-1),
            processState:
              animalData?.processState ?? data.processState ?? null,
            updatedAt: serverTimestamp(),
          });
          countDelta = -1;
        });
        setIsLiked(false);
        return countDelta;
      }

      if (!animalData) {
        alert('동물 정보를 불러온 뒤 다시 시도해 주세요.');
        return 0;
      }

      const processState = animalData.processState ?? null;
      const basePayload = buildLikedAnimalBase(animalData, desertionNo);

      let countDelta = 0;
      await runTransaction(firestore, async (transaction) => {
        const likedSnap = await transaction.get(likedRef);

        transaction.set(abRef, buildAbandonmentPayload(animalData));

        if (!likedSnap.exists()) {
          transaction.set(likedRef, {
            ...basePayload,
            likedUserID: [user.uid],
            likedCount: 1,
            processState,
            updatedAt: serverTimestamp(),
          });
          countDelta = 1;
          return;
        }

        const data = likedSnap.data() as Record<string, unknown>;
        const likedIds = (data.likedUserID as string[] | undefined) ?? [];
        if (likedIds.includes(user.uid)) {
          transaction.update(likedRef, {
            processState,
            updatedAt: serverTimestamp(),
            ...basePayload,
          });
          return;
        }

        transaction.update(likedRef, {
          ...basePayload,
          likedUserID: arrayUnion(user.uid),
          likedCount: increment(1),
          processState,
          updatedAt: serverTimestamp(),
        });
        countDelta = 1;
      });
      setIsLiked(true);
      return countDelta;
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
