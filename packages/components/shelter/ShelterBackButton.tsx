'use client';

import { useRouter } from 'next/navigation';
import { IoIosArrowBack } from 'react-icons/io';
import { useLanguage } from '@/lib/i18n/language';

export default function ShelterBackButton() {
  const router = useRouter();
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-2 self-start text-gray-600 transition-colors hover:text-gray-900"
    >
      <IoIosArrowBack className="h-5 w-5" />
      <span>{t('뒤로가기', 'Back')}</span>
    </button>
  );
}
