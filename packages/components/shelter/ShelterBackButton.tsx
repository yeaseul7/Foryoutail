'use client';

import { useRouter } from 'next/navigation';
import { IoIosArrowBack } from 'react-icons/io';

export default function ShelterBackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-2 self-start text-gray-600 transition-colors hover:text-gray-900"
    >
      <IoIosArrowBack className="h-5 w-5" />
      <span>뒤로가기</span>
    </button>
  );
}
