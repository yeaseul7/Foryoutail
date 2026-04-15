'use client';

import { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/firebase/auth';
import type { ShelterAnimalItem } from '@/packages/type/postType';

export interface UseShelterLikeReturn {
  /** 현재 찜 여부 */
  isLiked: boolean;
  /** 처리 중 여부 (중복 클릭 방지) */
  isUpdating: boolean;
  /** 찜 토글 핸들러 */
  handleLike: (e?: React.MouseEvent) => Promise<void>;
}

/**
 * 유기동물 찜(좋아요) 공통 훅.
 * Firestore 경로: users/{userId}/abandonment/{desertionNo}
 *
 * @param desertionNo 유기번호
 * @param animalData  저장할 동물 정보 (없으면 찜 저장 불가)
 */
export function useShelterLike(
  desertionNo: string | undefined,
  animalData?: ShelterAnimalItem
): UseShelterLikeReturn {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 초기 찜 상태 확인
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

  const handleLike = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!desertionNo || isUpdating) return;

    setIsUpdating(true);
    try {
      const ref = doc(firestore, 'users', user.uid, 'abandonment', desertionNo);

      if (isLiked) {
        await deleteDoc(ref);
        setIsLiked(false);
      } else {
        // 첫 번째 이미지 추출
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

        await setDoc(ref, {
          ...(animalData ?? {}),
          image: firstImage ?? null,
          createdAt: serverTimestamp(),
        });
        setIsLiked(true);
      }
    } catch (error) {
      console.error('찜 처리 실패:', error);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  return { isLiked, isUpdating, handleLike };
}
