'use client';

import { ShelterAnimalItem } from '@/packages/type/postType';
import { formatDateToKorean } from '@/packages/utils/dateFormatting';
import AnimalActions from './AnimalActions';
import { FaBuilding, FaLeaf, FaPaw } from 'react-icons/fa';
import { useLanguage } from '@/lib/i18n/language';
import { animalColorLabel, animalNoteLabel, animalWeightLabel } from '@/lib/i18n/animal-labels';

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
  const { isEnglish, t } = useLanguage();
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl lg:text-2xl font-bold text-gray-900">
            {breedText || t('이름 없음', 'Unnamed animal')}
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
          <span className="text-xs font-semibold text-gray-500">{t('나이', 'Age')}</span>
          <span className="text-[10px] font-bold text-gray-900 text-center break-words whitespace-normal">
            {isEnglish && animalData.birthYear
              ? `Born ${animalData.birthYear}`
              : animalData?.age || t('미상', 'Unknown')}
          </span>
        </div>
        <div className="flex min-h-[70px] flex-col items-center justify-center gap-0.5 rounded-xl border border-[#eadfd7] bg-[#faf7f4] p-3">
          <span className="text-xs font-semibold text-gray-500">{t('성별', 'Sex')}</span>
          <span className="text-[10px] font-bold text-gray-900 text-center">{genderText}</span>
        </div>
        <div className="flex min-h-[70px] flex-col items-center justify-center gap-0.5 rounded-xl border border-[#eadfd7] bg-[#faf7f4] p-3">
          <span className="text-xs font-semibold text-gray-500">{t('체중', 'Weight')}</span>
          <span className="text-[10px] font-bold text-gray-900 text-center">
            {animalWeightLabel(animalData?.weight, animalData?.weightKg, isEnglish) || t('미상', 'Unknown')}
          </span>
        </div>
        <div className="flex min-h-[70px] flex-col items-center justify-center gap-0.5 rounded-xl border border-[#eadfd7] bg-[#faf7f4] p-3 lg:col-span-2">
          <span className="text-xs font-semibold text-gray-500">{t('품종', 'Breed')}</span>
          <span className="text-[10px] font-bold text-gray-900 text-center break-words whitespace-normal w-full min-w-0">
            {breedText}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FaLeaf className="w-4 h-4 text-green-600" />
          <h2 className="text-lg font-bold text-gray-900">{t('발견 정보', 'Rescue details')}</h2>
        </div>
        <div className="text-sm text-gray-700 leading-relaxed">
          {animalData?.happenPlace && (
            <p className="mb-2">
              <span className="font-semibold">{t('구조 위치:', 'Found at:')}</span>{' '}
              {animalData.happenPlace}
            </p>
          )}
          {animalData?.happenDt && (
            <p >
              <span className="font-semibold">{t('구조 일시:', 'Found on:')}</span>{' '}
              {isEnglish ? animalData.happenDt.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : formatDateToKorean(animalData.happenDt)}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FaPaw className="w-4 h-4 text-primary1" />
          <h2 className="text-lg font-bold text-gray-900">
            {t('특징', 'Characteristics')}
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {animalData?.sfeSoci && (
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <span>{t('사회성', 'Sociability')}</span>
                <span className="text-sm text-gray-700">
                  {animalData.sfeSoci}
                </span>
              </div>
            )}
            {animalData?.sfeHealth && (
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <span>{t('건강상태', 'Health')}</span>
                <span className="text-sm text-gray-700">
                  {animalData.sfeHealth}
                </span>
              </div>
            )}
            {animalData?.neuterYn && (
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  {t('중성화:', 'Neutered:')}{' '}
                  {animalData.neuterYn === 'Y'
                    ? t('완료', 'Yes')
                    : animalData.neuterYn === 'N'
                      ? t('미완료', 'No')
                      : t('미상', 'Unknown')}
                </span>
              </div>
            )}
            {animalData?.colorCd && (
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  {t('색상:', 'Color:')} {animalColorLabel(animalData.colorCd, isEnglish)}
                </span>
              </div>
            )}
          </div>
          {animalData?.specialMark && (
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2 w-full">
              <span className="text-sm text-gray-700">
                {t('특징:', 'Notes:')} {animalNoteLabel(animalData.specialMark, isEnglish)}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FaBuilding className="w-4 h-4 text-primary1" />
          <h2 className="text-lg font-bold text-gray-900">
            {t('보호소 정보', 'Shelter information')}
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          {animalData?.careNm && (
            <div className="flex items-start gap-3 py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 min-w-[80px]">{t('보호소명:', 'Shelter:')}</span>
              <span className="text-sm text-gray-700 flex-1">
                {animalData.careNm}
              </span>
            </div>
          )}
          {animalData?.careNm && (
            <div className="flex items-start gap-3 py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 min-w-[80px]">{t('보호소 대표:', 'Manager:')}</span>
              <span className="text-sm text-gray-700 flex-1">
                {animalData.careOwnerNm}
              </span>
            </div>
          )}

          {animalData?.careAddr && (
            <div className="flex items-start gap-3 py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 min-w-[80px]">{t('주소:', 'Address:')}</span>
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
