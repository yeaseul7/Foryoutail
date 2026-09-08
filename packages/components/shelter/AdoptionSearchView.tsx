'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/language';
import ShelterPostsClient, { type ShelterPostsClientProps } from './ShelterPostsClient';
import ShelterDirectory from './ShelterDirectory';

export default function AdoptionSearchView(props: ShelterPostsClientProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'listings' | 'shelters'>('listings');

  useEffect(() => {
    if (sessionStorage.getItem('findme:adoption-search-mode') === 'shelters') {
      queueMicrotask(() => setMode('shelters'));
    }
  }, []);

  const changeMode = (nextMode: 'listings' | 'shelters') => {
    sessionStorage.setItem('findme:adoption-search-mode', nextMode);
    setMode(nextMode);
  };

  return (
    <div className="w-full">
      <div className="mx-auto flex w-full max-w-2xl gap-5 px-1 pt-4 sm:pt-5" role="tablist" aria-label={t('조회 대상', 'Search type')}>
        <button type="button" role="tab" aria-selected={mode === 'listings'} onClick={() => changeMode('listings')} className={`border-b-2 px-1 pb-2 text-sm font-bold transition ${mode === 'listings' ? 'border-primary1 text-primary1' : 'border-transparent text-[#817873] hover:text-[#332d2a]'}`}>{t('공고 조회', 'Listings')}</button>
        <button type="button" role="tab" aria-selected={mode === 'shelters'} onClick={() => changeMode('shelters')} className={`border-b-2 px-1 pb-2 text-sm font-bold transition ${mode === 'shelters' ? 'border-primary1 text-primary1' : 'border-transparent text-[#817873] hover:text-[#332d2a]'}`}>{t('보호소 조회', 'Shelters')}</button>
      </div>
      {mode === 'listings' ? <ShelterPostsClient {...props} /> : <ShelterDirectory />}
    </div>
  );
}
