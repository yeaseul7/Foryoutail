'use client';
import { useAuth } from '@/lib/firebase/auth';
import { firestore } from '@/lib/firebase/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Loading from '../../base/Loading';
import { ShelterAnimalItem } from '@/packages/type/postType';
import AbandonedCard from '../../base/AbandonedCard';

export default function LikedAnimalList({ userId }: { userId?: string }) {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<ShelterAnimalItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="grid grid-cols-1 gap-2 pt-8 w-full sm:grid-cols-2 md:grid-cols-3 justify-items-center">
      {animals.map((animal) => (
        <AbandonedCard key={animal.desertionNo} shelterAnimal={animal} />
      ))}
    </div>
  );
}
