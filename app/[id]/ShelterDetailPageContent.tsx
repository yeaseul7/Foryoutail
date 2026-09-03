'use client';

import { useEffect } from 'react';

import PageTemplate from '@/packages/components/base/PageTemplate';
import PageFooter from '@/packages/components/base/PageFooter';
import AnimalImgCard from '@/packages/components/shelter/AnimalImgCard';
import AnimalInfoCard from '@/packages/components/shelter/AnimalInfoCard';
import ShelterOperationInfoComponent from '@/packages/components/common/AnimalNotice';
import type { ShelterAnimalItem } from '@/packages/type/postType';
import type { ShelterInfoItem } from '@/packages/type/shelterTyps';
import { getBaseUrl, normalizeImageUrl } from '@/packages/utils/metadata';
import { useLanguage } from '@/lib/i18n/language';
import { animalBreedLabel } from '@/lib/i18n/animal-labels';
import { trackEvent } from '@/lib/analytics';

function animalImages(animal: ShelterAnimalItem): string[] {
  const images: string[] = [];
  for (let index = 1; index <= 8; index += 1) {
    const image = animal[`popfile${index}` as keyof ShelterAnimalItem];
    if (typeof image === 'string' && image.trim()) images.push(image);
  }
  return images;
}

function normalizedStatus(value: string | undefined, isEnglish: boolean): string {
  if (value === 'protect') return isEnglish ? 'In protection' : '보호중';
  if (value === 'notice') return isEnglish ? 'Notice open' : '공고중';
  if (value === 'adopted') return isEnglish ? 'Adopted' : '입양 완료';
  if (value === 'returned') return isEnglish ? 'Returned' : '반환 완료';
  if (value === 'ended') return isEnglish ? 'Closed' : '종료';
  return value?.trim() || (isEnglish ? 'Unknown' : '미상');
}

function normalizedGender(value: string | undefined, isEnglish: boolean): string {
  if (value === 'F') return isEnglish ? 'Female' : '암컷';
  if (value === 'M') return isEnglish ? 'Male' : '수컷';
  return isEnglish ? 'Unknown' : '미상';
}

function isoDate(value: string | undefined): string | undefined {
  const digits = value?.replace(/\D/g, '').slice(0, 8);
  if (!digits || digits.length !== 8) return undefined;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

export default function ShelterDetailPageContent({
  animalData,
  shelterInfo,
}: {
  animalData: ShelterAnimalItem;
  shelterInfo: ShelterInfoItem | null;
}) {
  const { isEnglish, t } = useLanguage();
  const images = animalImages(animalData);
  const desertionNo = animalData.desertionNo ?? '';
  const animalId = animalData.id?.trim() || desertionNo;

  useEffect(() => {
    trackEvent('view_animal_detail', {
      animal_id: animalId,
      animal_type: animalData.upKindCd ?? animalData.upKindNm,
    });
  }, [animalData.upKindCd, animalData.upKindNm, animalId]);

  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const pageUrl = `${baseUrl}/${desertionNo}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${animalData.kindNm || animalData.kindFullNm || '유기동물'} 입양 공고`,
    description: animalData.specialMark || `${animalData.careNm || '보호소'}에서 보호 중인 유기동물 입양 공고`,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    image: images.map((image) => normalizeImageUrl(image, baseUrl)),
    datePublished: isoDate(animalData.noticeSdt || animalData.happenDt),
    dateModified: isoDate(animalData.updTm || animalData.noticeSdt),
    about: {
      '@type': 'Thing',
      name: animalData.kindNm || animalData.kindFullNm || '유기동물',
      description: animalData.specialMark || undefined,
      identifier: desertionNo,
    },
    provider: {
      '@type': 'AnimalShelter',
      name: animalData.careNm || shelterInfo?.careNm || '동물보호소',
      telephone: animalData.careTel || shelterInfo?.careTel || undefined,
      address: animalData.careAddr || shelterInfo?.careAddr || undefined,
    },
  };

  return (
    <div className="min-h-screen w-full bg-white font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <main className="flex min-h-screen w-full flex-col items-center justify-between bg-white">
        <PageTemplate>
          <article className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
              <AnimalImgCard
                animalData={animalData}
                animalImgList={images}
              />
              <div className="flex flex-col gap-6">
                <AnimalInfoCard
                  animalData={animalData}
                  statusText={normalizedStatus(animalData.processState, isEnglish)}
                  genderText={normalizedGender(animalData.sexCd, isEnglish)}
                  breedText={animalBreedLabel(animalData.kindNm || animalData.kindFullNm, isEnglish) || t('품종 미상', 'Unknown breed')}
                  desertionNo={desertionNo}
                />
                <ShelterOperationInfoComponent shelterInfo={shelterInfo} animalData={animalData} />
              </div>
            </div>
          </article>
        </PageTemplate>
        <PageFooter />
      </main>
    </div>
  );
}
