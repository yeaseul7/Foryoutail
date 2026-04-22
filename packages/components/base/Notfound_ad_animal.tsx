import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import PageTemplate from './PageTemplate';
import dynamic from 'next/dynamic';

const Lottie = dynamic(
  () => import('lottie-react'),
  {
    ssr: false,
    loading: () => <div className="w-full h-full" />
  }
);

interface Notfound_ad_animalProps {
  emptyAnimationData: object | null;
  error: string;
  router: AppRouterInstance;
}

export default function Notfound_ad_animal({
  emptyAnimationData,
  error,
  router,
}: Notfound_ad_animalProps) {
  return (
    <div className="w-full min-h-screen font-sans bg-white">
      <main className="flex flex-col justify-between items-center w-full min-h-screen bg-whitesm:items-start">
        <PageTemplate>
          <div className="flex flex-col items-center justify-center gap-4 py-12 w-full">
            {emptyAnimationData && (
              <div className="w-64 h-64 sm:w-80 sm:h-80">
                <Lottie animationData={emptyAnimationData} loop={true} />
              </div>
            )}
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                동물 정보를 찾을 수 없습니다
              </h2>
              <p className="text-gray-500">
                {error || '요청하신 동물의 정보를 찾을 수 없습니다.'}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="mt-4 px-6 py-2 bg-primary2 hover:bg-primary1 text-white font-semibold rounded-lg transition-colors"
            >
              뒤로가기
            </button>
          </div>
        </PageTemplate>
      </main>
    </div>
  );
}