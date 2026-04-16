'use client';

import { ShelterAnimalItem } from '@/packages/type/postType';
import Image from 'next/image';
import { HiHeart, HiOutlineHeart } from 'react-icons/hi2';
import { useRouter } from 'next/navigation';
import { IoIosCalendar } from 'react-icons/io';
import { useShelterLike } from '@/hooks/useShelterLike';

export default function WatingAnimalCard({ animal }: { animal: ShelterAnimalItem }) {
  const router = useRouter();
  const { isLiked, isUpdating, handleLike } = useShelterLike(
    animal.desertionNo,
    animal,
  );

  const getGenderText = (sexCd?: string) => {
    if (sexCd === 'M') return '수컷';
    if (sexCd === 'F') return '암컷';
    return '미상';
  };

  const getAgeText = (age?: string) => {
    if (!age) return '';
    if (age.includes('년')) return age;
    if (age.includes('개월')) return age;
    return age;
  };

  const formatRescueDate = (happenDt?: string) => {
    if (!happenDt) return '';
    if (happenDt.length >= 8) {
      return `${happenDt.slice(0, 4)}.${happenDt.slice(4, 6)}.${happenDt.slice(6, 8)}`;
    }
    return happenDt;
  };

  const imageUrl = animal.popfile1 || '/static/images/defaultDog.png';
  const animalName = animal.kindNm || animal.kindFullNm || '이름 없음';
  const age = getAgeText(animal.age);
  const breed = animal.kindNm || '품종 미상';
  const gender = getGenderText(animal.sexCd);
  const rescueDate = formatRescueDate(animal.happenDt);

  const getStatusBadge = () => {
    if (!animal.processState) return null;

    if (animal.processState === 'notice') {
      return {
        text: '공고중',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
      };
    }
    if (animal.processState === 'protect') {
      return {
        text: '보호중',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
      };
    }
    return {
      text: animal.processState,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      key={animal.desertionNo || animal.noticeNo}
      className="bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative w-full h-48">
        <Image
          src={imageUrl}
          alt={animalName}
          fill
          className="object-cover"
          unoptimized
        />
        {statusBadge && (
          <div className="absolute top-1.5 left-1.5">
            <span
              className={`inline-flex items-center rounded-3xl ${statusBadge.bgColor} ${statusBadge.textColor} px-3 py-1 text-xs font-semibold`}
            >
              {statusBadge.text}
            </span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-bold text-gray-900 flex-1">{animalName}</h3>
          <button
            type="button"
            onClick={(e) => void handleLike(e)}
            disabled={isUpdating}
            aria-label={isLiked ? '찜 해제' : '찜하기'}
            className={`ml-2 shrink-0 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLiked ? (
              <HiHeart className="w-4 h-4 text-red-600" />
            ) : (
              <HiOutlineHeart className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        <div className="text-xs text-gray-600">
          {age && breed && gender ? (
            <span>
              {age} · {breed} · {gender}
            </span>
          ) : (
            <span>{age || breed || gender || '정보 없음'}</span>
          )}
        </div>

        {rescueDate && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <IoIosCalendar className="w-3 h-3" />
            <span>{rescueDate} 구조</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (animal.desertionNo) {
              router.push(`/shelter/${animal.desertionNo}`);
            }
          }}
          className="w-full font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl py-2.5 px-3 text-xs transition-colors mt-1"
        >
          자세히 보기
        </button>
      </div>
    </div>
  );
}
