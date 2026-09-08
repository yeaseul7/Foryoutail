'use client';


import Image from 'next/image';
import Link from 'next/link';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { useLanguage } from '@/lib/i18n/language';
import PageFooter from '@/packages/components/base/PageFooter';
import PageTemplate from '@/packages/components/base/PageTemplate';
import type { ShelterInfoItem } from '@/packages/type/shelterTyps';
import type { ShelterAnimalItem } from '@/packages/type/postType';
import AbandonedCard from '@/packages/components/base/AbandonedCard';
import { closedDayLabel } from '@/lib/i18n/animal-labels';

export default function ShelterPageContent({ shelter, noticeAnimalCount, protectedAnimalCount, animals, currentPage, totalPages }: { shelter: ShelterInfoItem; noticeAnimalCount: number; protectedAnimalCount: number; animals: ShelterAnimalItem[]; currentPage: number; totalPages: number }) {
  const { isEnglish, t } = useLanguage();
  const address = shelter.careAddr || shelter.jibunAddr || '';
  const operationHours = shelter.weekOprStime && shelter.weekOprEtime ? `${shelter.weekOprStime} ~ ${shelter.weekOprEtime}` : null;
  const phone = shelter.careTel?.trim() || '';
  const dialNumber = phone.replace(/[^\d+]/g, '');
  const callable = Boolean(phone && !phone.includes('*') && dialNumber.length >= 3);
  const details = [
    [t('주소', 'Address'), address],
    [t('보호 대상', 'Animals cared for'), shelter.saveTrgtAnimal],
    [t('형태', 'Type'), shelter.divisionNm],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return <main className="min-h-screen bg-white">
    <PageTemplate>
      <article className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-2 pb-6 pt-2 sm:gap-5 sm:px-6 sm:py-8">
        <header className="py-2 sm:py-3">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
            <h1 className="min-w-0 flex-1 text-lg font-extrabold text-[#332d2a] sm:text-2xl">{shelter.careNm || t('동물보호소', 'Animal shelter')}</h1>
            {address && <div className="flex w-full gap-2 text-[11px] font-bold sm:w-auto sm:shrink-0 sm:text-xs">
              <a href={`https://map.naver.com/p/search/${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-lg border border-[#03c75a]/40 px-2.5 py-2 text-center text-[#03a84d] hover:bg-[#03c75a]/5 sm:flex-none sm:px-3">{t('네이버 지도', 'Naver Maps')}</a>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-lg border border-[#4285f4]/40 px-2.5 py-2 text-center text-[#3574d4] hover:bg-[#4285f4]/5 sm:flex-none sm:px-3">{t('구글 지도', 'Google Maps')}</a>
            </div>}
          </div>
        </header>
        <section className="py-1">
          <dl className="grid grid-cols-1 gap-y-3">
            {details.map(([label, value]) => <div key={label} className="grid grid-cols-[72px_1fr] gap-2 text-xs sm:grid-cols-[88px_1fr] sm:gap-3 sm:text-sm">
              <dt className="font-semibold text-[#817873]">{label}</dt>
              <dd className="min-w-0 break-words font-medium text-[#332d2a]">{value}</dd>
            </div>)}
          </dl>
        </section>
        <section className="rounded-[14px] bg-primary-soft p-3 sm:p-5">
          <h2 className="text-base font-extrabold text-[#332d2a]">{t('입양 문의', 'Adoption inquiry')}</h2>
          <p className="mt-2 text-sm text-[#5f5752]">{t('입양 문의는 보호소에 전화로 문의해주세요.', 'Please contact the shelter by phone about adoption.')}</p>
          {isEnglish && <p className="mt-3 text-xs text-[#817873]">All times are in Korea Standard Time (KST, UTC+9).</p>}
          <dl className="mt-3 grid gap-3 rounded-xl bg-white p-3 text-xs sm:mt-4 sm:p-4 sm:text-sm">
            {operationHours && <div className="grid grid-cols-[72px_1fr] gap-2 sm:grid-cols-[88px_1fr] sm:gap-3">
              <dt className="font-semibold text-[#817873]">{t('운영시간', 'Hours')}</dt>
              <dd className="font-medium text-[#332d2a]">{operationHours}</dd>
            </div>}
            {shelter.closeDay && <div className="grid grid-cols-[72px_1fr] gap-2 sm:grid-cols-[88px_1fr] sm:gap-3">
              <dt className="font-semibold text-[#817873]">{t('휴무일', 'Closed')}</dt>
              <dd className="font-medium text-[#332d2a]">{closedDayLabel(shelter.closeDay, isEnglish)}</dd>
            </div>}
            {phone && <div className="grid grid-cols-[72px_1fr] gap-2 sm:grid-cols-[88px_1fr] sm:gap-3">
              <dt className="font-semibold text-[#817873]">{t('전화번호', 'Phone')}</dt>
              <dd>{callable ? <a href={`tel:${dialNumber}`} className="font-bold text-primary1 underline decoration-primary1/30 underline-offset-2">{phone}</a> : <span className="font-medium text-[#332d2a]">{phone}</span>}</dd>
            </div>}
          </dl>
        </section>
        <section className="mt-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex min-w-0 items-center gap-1.5 text-sm font-extrabold text-[#332d2a] sm:gap-2 sm:text-base">
              <span className="flex shrink-0 items-center" aria-hidden>
                <Image src="/static/images/shelter-waiting-dog.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                <Image src="/static/images/shelter-waiting-cat.png" alt="" width={28} height={28} className="-ml-1.5 h-7 w-7 object-contain" />
              </span>
              <span>{t(
                `공고중 ${noticeAnimalCount}마리 · 보호중 ${protectedAnimalCount}마리`,
                `${noticeAnimalCount} listed · ${protectedAnimalCount} in care`,
              )}</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {animals.map((animal, index) => <AbandonedCard key={animal.id || animal.desertionNo} shelterAnimal={animal} priority={index < 3} hideShelterInfo spacious />)}
          </div>
          {totalPages > 1 && <nav className="mt-6 flex items-center justify-center gap-4" aria-label={t('보호소 동물 페이지', 'Shelter animal pages')}>
            {currentPage > 1 ? <Link href={`?page=${currentPage - 1}`} scroll className="rounded-xl bg-white p-2 text-[#817873] shadow-sm transition hover:bg-primary-soft hover:text-primary1" aria-label={t('이전 페이지', 'Previous page')}><MdChevronLeft className="h-5 w-5" /></Link> : <span className="p-2 opacity-30"><MdChevronLeft className="h-5 w-5" /></span>}
            <span className="text-sm font-bold text-[#5f5752]">{currentPage} / {totalPages}</span>
            {currentPage < totalPages ? <Link href={`?page=${currentPage + 1}`} scroll className="rounded-xl bg-white p-2 text-[#817873] shadow-sm transition hover:bg-primary-soft hover:text-primary1" aria-label={t('다음 페이지', 'Next page')}><MdChevronRight className="h-5 w-5" /></Link> : <span className="p-2 opacity-30"><MdChevronRight className="h-5 w-5" /></span>}
          </nav>}
        </section>
      </article>
    </PageTemplate>
    <PageFooter />
  </main>;
}
