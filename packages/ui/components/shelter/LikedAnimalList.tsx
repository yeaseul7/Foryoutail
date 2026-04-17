'use client';
import { useAuth } from '@/lib/firebase/auth';
import { firestore } from '@/lib/firebase/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import Loading from '../base/Loading';
import { ShelterAnimalItem } from '@/packages/type/postType';
import AbandonedCard from '../base/AbandonedCard';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

export default function LikedAnimalList({ userId }: { userId?: string }) {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<ShelterAnimalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const targetUserId = userId || user?.uid;

  useEffect(() => {
    const fetchLikedAnimals = async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        // users/{userId}/abandonment 서브컬렉션에서 모든 데이터 가져오기
        const abandonmentRef = collection(
          firestore,
          'users',
          targetUserId,
          'abandonment'
        );

        // createdAt 기준으로 최신순 정렬
        const q = query(abandonmentRef, orderBy('createdAt', 'desc'));
        const abandonmentSnapshot = await getDocs(q);

        const animalsList = abandonmentSnapshot.docs.map((doc) => ({
          ...doc.data(),
        })) as ShelterAnimalItem[];

        setAnimals(animalsList);
      } catch (error) {
        console.error('좋아요한 동물 조회 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedAnimals();
  }, [targetUserId]);

  if (loading) {
    return <Loading />;
  }

  if (!targetUserId) {
    return (
      <div className="py-12 text-center text-gray-500">
        사용자 정보를 불러올 수 없습니다.
      </div>
    );
  }

  if (animals.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        좋아요한 구조 동물이 없습니다.
      </div>
    );
  }

  const scrollByCard = (dir: 'left' | 'right') => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' });
  };

  return (
    <div className="w-full pt-6">
      <div className="mb-2 flex items-center justify-end gap-1">
        <button type="button" onClick={() => scrollByCard('left')} className="inline-flex items-center gap-1 rounded-full border border-primary1/30 bg-primary1/10 px-2.5 py-1.5 text-xs font-semibold text-primary1 transition-colors hover:bg-primary1/20" aria-label="왼쪽으로 이동">
          <MdChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => scrollByCard('right')} className="inline-flex items-center gap-1 rounded-full border border-primary1/30 bg-primary1/10 px-2.5 py-1.5 text-xs font-semibold text-primary1 transition-colors hover:bg-primary1/20" aria-label="오른쪽으로 이동">
          <MdChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={scrollerRef}
        className="flex w-full gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        aria-label="좋아요한 구조 동물 목록"
      >
        {animals.map((animal) => (
          <div key={animal.desertionNo} className="min-w-0 snap-start shrink-0 basis-[82%] sm:basis-[48%] lg:basis-[32%]">
            <AbandonedCard shelterAnimal={animal} />
          </div>
        ))}
      </div>
    </div>
  );
}
