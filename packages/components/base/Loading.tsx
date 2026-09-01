'use client';

import { useLanguage } from '@/lib/i18n/language';

export default function Loading() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col justify-center items-center gap-3 py-12">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-primary1/20 border-t-primary1"
        aria-hidden
      />
      <p className="text-sm text-gray-500">{t('로딩 중...', 'Loading...')}</p>
    </div>
  );
}
