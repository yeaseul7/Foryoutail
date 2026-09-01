import { ShelterAnimalItem } from '@/packages/type/postType';
import { formatDateToKorean } from '@/packages/utils/dateFormatting';
import AnimalActions from './AnimalActions';
import { FaBuilding, FaLeaf, FaPaw } from 'react-icons/fa';

interface AnimalInfoCardProps {
  animalData: ShelterAnimalItem;
  statusText: string;
  genderText: string;
  breedText: string;
  desertionNo: string;
}
export default function AnimalInfoCard({
  animalData,
  statusText,
  genderText,
  breedText,
  desertionNo,
}: AnimalInfoCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl lg:text-2xl font-bold text-gray-900">
            {animalData?.kindFullNm || '이름 없음'}
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-semibold text-gray-600">
              {statusText}
            </span>
          </div>
        </div>
        <AnimalActions animal={{ ...animalData, desertionNo }} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="flex min-h-[70px] flex-col items-center justify-center gap-0.5 rounded-xl border border-[#eadfd7] bg-[#faf7f4] p-3 lg:col-span-2">
          <span className="text-xs font-semibold text-gray-500">나이</span>
          <span className="text-[10px] font-bold text-gray-900 text-center break-words whitespace-normal">
            {animalData?.age || '미상'}
          </span>
        </div>
        <div className="flex min-h-[70px] flex-col items-center justify-center gap-0.5 rounded-xl border border-[#eadfd7] bg-[#faf7f4] p-3">
          <span className="text-xs font-semibold text-gray-500">성별</span>
          <span className="text-[10px] font-bold text-gray-900 text-center">{genderText}</span>
        </div>
        <div className="flex min-h-[70px] flex-col items-center justify-center gap-0.5 rounded-xl border border-[#eadfd7] bg-[#faf7f4] p-3">
          <span className="text-xs font-semibold text-gray-500">체중</span>
          <span className="text-[10px] font-bold text-gray-900 text-center">
            {animalData?.weight || '미상'}
          </span>
        </div>
        <div className="flex min-h-[70px] flex-col items-center justify-center gap-0.5 rounded-xl border border-[#eadfd7] bg-[#faf7f4] p-3 lg:col-span-2">
          <span className="text-xs font-semibold text-gray-500">품종</span>
          <span className="text-[10px] font-bold text-gray-900 text-center break-words whitespace-normal w-full min-w-0">
            {breedText}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FaLeaf className="w-4 h-4 text-green-600" />
          <h2 className="text-lg font-bold text-gray-900">발견 정보</h2>
        </div>
        <div className="text-sm text-gray-700 leading-relaxed">
          {animalData?.happenPlace && (
            <p className="mb-2">
              <span className="font-semibold">구조 위치:</span>{' '}
              {animalData.happenPlace}
            </p>
          )}
          {animalData?.happenDt && (
            <p >
              <span className="font-semibold">구조 일시:</span>{' '}
              {formatDateToKorean(animalData.happenDt)}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FaPaw className="w-4 h-4 text-primary1" />
          <h2 className="text-lg font-bold text-gray-900">
            특징
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {animalData?.sfeSoci && (
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <span>사회성</span>
                <span className="text-sm text-gray-700">
                  {animalData.sfeSoci}
                </span>
              </div>
            )}
            {animalData?.sfeHealth && (
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <span>건강상태</span>
                <span className="text-sm text-gray-700">
                  {animalData.sfeHealth}
                </span>
              </div>
            )}
            {animalData?.neuterYn && (
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  중성화:{' '}
                  {animalData.neuterYn === 'Y'
                    ? '완료'
                    : animalData.neuterYn === 'N'
                      ? '미완료'
                      : '미상'}
                </span>
              </div>
            )}
            {animalData?.colorCd && (
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  색상: {animalData.colorCd}
                </span>
              </div>
            )}
          </div>
          {animalData?.specialMark && (
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2 w-full">
              <span className="text-sm text-gray-700">
                특징: {animalData.specialMark}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FaBuilding className="w-4 h-4 text-primary1" />
          <h2 className="text-lg font-bold text-gray-900">
            보호소 정보
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          {animalData?.careNm && (
            <div className="flex items-start gap-3 py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 min-w-[80px]">보호소명:</span>
              <span className="text-sm text-gray-700 flex-1">
                {animalData.careNm}
              </span>
            </div>
          )}
          {animalData?.careNm && (
            <div className="flex items-start gap-3 py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 min-w-[80px]">보호소 대표:</span>
              <span className="text-sm text-gray-700 flex-1">
                {animalData.careOwnerNm}
              </span>
            </div>
          )}

          {animalData?.careAddr && (
            <div className="flex items-start gap-3 py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 min-w-[80px]">주소:</span>
              <span className="text-sm text-gray-700 flex-1">
                {animalData.careAddr}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
