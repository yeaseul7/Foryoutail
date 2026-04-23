'use client';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

export default function NotFound({ error }: { error: string }) {
  const router = useRouter();

  const canGoBack = useMemo(() => {
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      const currentOrigin = window.location.origin;
      return Boolean(
        referrer && referrer.length > 0 && referrer.startsWith(currentOrigin),
      );
    }
    return false;
  }, []);

  return (
    <div className="flex flex-col justify-center items-center py-12">
      <div className="text-red-500">
        {error || '게시물을 찾을 수 없습니다.'}
      </div>
      {canGoBack && (
        <button
          onClick={() => router.back()}
          className="flex gap-2 items-center px-4 py-2 mt-4 text-white bg-primary1 rounded"
        >
          뒤로가기
        </button>
      )}
    </div>
  );
}
