'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import type { ShelterInfoItem } from '@/packages/type/shelterTyps';

interface FavoriteShelterListProps {
  userId?: string;
}

export default function FavoriteShelterList({ userId }: FavoriteShelterListProps) {
  const [items, setItems] = useState<ShelterInfoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!userId) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const favSnap = await getDocs(collection(firestore, 'users', userId, 'Favorites'));
        const shelterIds = favSnap.docs.map((d) => d.id).filter(Boolean);
        if (shelterIds.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }

        const rows = await Promise.all(
          shelterIds.map(async (id) => {
            const byId = await getDoc(doc(firestore, 'shelter-info', id));
            if (byId.exists()) {
              return byId.data() as ShelterInfoItem;
            }
            return { careRegNo: id, careNm: '보호소' } as ShelterInfoItem;
          }),
        );
        setItems(rows);
      } catch (e) {
        console.error('즐겨찾기 보호소 조회 실패:', e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [userId]);

  if (loading) {
    return <div className="text-sm text-gray-500">즐겨찾기한 보호소를 불러오는 중...</div>;
  }

  if (items.length === 0) {
    return <div className="text-sm text-gray-500">즐겨찾기한 보호소가 없습니다.</div>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, idx) => {
        const id = (item.careRegNo ?? '').trim();
        return (
          <li
            key={`${id || 'unknown'}-${idx}`}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3"
          >
            {id ? (
              <Link href={`/animalShelter/${id}`} className="text-sm font-semibold text-primary1 hover:underline">
                {item.careNm || '보호소'} ({id})
              </Link>
            ) : (
              <span className="text-sm text-gray-700">{item.careNm || '보호소'}</span>
            )}
            {item.careAddr ? (
              <p className="mt-1 text-xs text-gray-500">{item.careAddr}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
