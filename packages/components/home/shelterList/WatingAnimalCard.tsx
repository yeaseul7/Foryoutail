'use client';

import { ShelterAnimalItem } from '@/packages/type/postType';
import { HiHeart, HiOutlineHeart } from 'react-icons/hi2';
import { useRouter } from 'next/navigation';
import { IoIosArrowForward } from 'react-icons/io';
import { useShelterLike } from '@/hooks/useShelterLike';
import { normalizeAnimalImageUrl } from '@/packages/utils/imageSource';
import CardImage from '@/packages/components/common/CardImage';

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

  const imageUrl = normalizeAnimalImageUrl(animal.popfile1 || '/static/images/defaultDog.png');
  const animalName = animal.specialMark || '특징 없음';
  const age = getAgeText(animal.age);
  const breed = animal.kindNm || '품종 미상';
  const gender = getGenderText(animal.sexCd);
  const ageBreedGender = [age, breed, gender].filter(Boolean);

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
      className="group overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(15,23,42,0.14)]"
    >
      <div className="relative h-72 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
        <div className="absolute inset-0 scale-110">
          <CardImage
            src={imageUrl}
            alt=""
            className="object-cover blur-2xl opacity-45"
            sizes="(max-width: 768px) 100vw, 320px"
            unoptimized
          />
        </div>
        <div className="absolute inset-0 bg-white/28" />
        <CardImage
          src={imageUrl}
          alt={animalName}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 100vw, 320px"
          unoptimized
        />
        {statusBadge && (
          <div className="absolute left-3 top-3">
            <span
              className={`inline-flex items-center rounded-full ${statusBadge.bgColor} ${statusBadge.textColor} px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur-sm`}
            >
              {statusBadge.text}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={(e) => void handleLike(e)}
          disabled={isUpdating}
          aria-label={isLiked ? '찜 해제' : '찜하기'}
          className={`absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/92 text-slate-500 shadow-sm backdrop-blur-sm transition-colors ${isUpdating ? 'cursor-not-allowed opacity-50' : 'hover:bg-white hover:text-rose-500'
            }`}
        >
          {isLiked ? (
            <HiHeart className="h-5 w-5 text-rose-500" />
          ) : (
            <HiOutlineHeart className="h-5 w-5" />
          )}
        </button>
      </div>
      <div className="flex flex-col gap-4 bg-gradient-to-b from-white to-slate-50/80 p-4">
        <div className="flex flex-col gap-2">
          <h3 className="line-clamp-1 text-md font-extrabold tracking-[-0.02em] text-slate-900">
            {animalName}
          </h3>

          <div className="flex flex-wrap gap-2">
            {ageBreedGender.length > 0 ? (
              ageBreedGender.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                정보 없음
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (animal.desertionNo) {
              router.push(`/shelter/${animal.desertionNo}`);
            }
          }}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary1/10 px-4 py-2.5 text-sm font-bold text-primary1 transition-colors hover:bg-primary1/15"
        >
          자세히 보기
          <IoIosArrowForward className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
