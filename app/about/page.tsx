import type { Metadata } from 'next';
import Link from 'next/link';
import PageFooter from '@/packages/components/base/PageFooter';
import PageTemplate from '@/packages/components/base/PageTemplate';
import { generateDefaultMetadata } from '@/packages/utils/metadata';

export const metadata: Metadata = generateDefaultMetadata(
  '서비스 소개',
  '포유테일이 어떤 방식으로 유기동물 공고, 보호소 정보, 커뮤니티 경험을 하나의 흐름으로 연결하는지 소개합니다.',
  'https://www.kkosunnae.com/about',
  {
    includeCanonical: true,
  },
);

const featureRows = [
  {
    eyebrow: 'Adoption',
    title: '가족을 기다리는 아이들을\n한눈에 볼 수 있도록.',
    body: '흩어진 유기동물 공고를 지역, 축종, 보호 상태별로 정리해 보여줍니다. 입양을 고민하는 순간 필요한 정보를 더 쉽게 확인할 수 있습니다.',
  },
  {
    eyebrow: 'AI Search',
    title: '기억 속 모습과 닮은 아이를\n더 쉽게 찾을 수 있도록.',
    body: '사진과 특징을 기반으로 비슷한 공고를 탐색합니다. 잃어버린 반려동물을 찾거나, 원하는 외형의 아이를 찾는 과정을 더 자연스럽게 연결합니다.',
  },
  {
    eyebrow: 'Stories',
    title: '입양 이후의 이야기도\n함께 이어질 수 있도록.',
    body: '입양 후기와 반려 생활 경험을 나누는 공간입니다. 작은 기록들이 모여 다음 입양자에게 따뜻하고 현실적인 참고가 됩니다.',
  },
] as const;

const statCards = [
  { value: 'Adoption First', label: '사지 않고 입양하는 문화를 위한 서비스' },
  { value: 'Simple Search', label: '지역·축종·상태별로 빠르게 찾는 공고 탐색' },
  { value: 'Shared Stories', label: '입양 후기와 반려 생활 경험이 쌓이는 커뮤니티' },
] as const;

export default function AboutPage() {
  return (
    <main className="page-container-full">
      <PageTemplate>
        <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col py-6 sm:py-8">
          <div className="overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_top,#fff1bf_0%,#fff7df_28%,#ffffff_62%)]">
            <section className="px-6 pb-14 pt-16 text-center sm:px-10 sm:pb-20 sm:pt-24 lg:px-16 lg:pt-28">
              <p className="text-sm font-semibold tracking-[0.24em] text-amber-700 uppercase">
                About Foryoutail
              </p>
              <h1 className="mx-auto mt-5 max-w-5xl text-4xl font-semibold tracking-[-0.04em] text-gray-950 sm:text-6xl lg:text-7xl">
                가족을 기다리는 아이들을
                <br />
                더 쉽게 만날 수 있도록.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
                포유테일은 입양 정보를 한곳에서 연결하는
                반려동물 입양 커뮤니티입니다.
                <br />
                입양을 고민하는 순간부터 함께하는 순간까지 이어갑니다.
              </p>
            </section>

            <section className="px-4 pb-6 sm:px-8 lg:px-10">
              <div className="grid gap-4 md:grid-cols-3">
                {statCards.map((card) => (
                  <article
                    key={card.value}
                    className="rounded-[2rem] border border-white/70 bg-white/80 px-6 py-7 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur"
                  >
                    <div className="text-2xl font-semibold tracking-[-0.04em] text-gray-950 sm:text-3xl">
                      {card.value}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-gray-600">{card.label}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="px-2 py-16 sm:px-4 sm:py-24">
            <div className="text-center">
              <p className="text-sm font-semibold tracking-[0.22em] text-gray-500 uppercase">
                Why We Exist
              </p>
              <h2 className="mx-auto mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-gray-950 sm:text-5xl">
                기억 속 모습 하나로도,
                <br />
                다시 만날 가능성을 높일 수 있도록.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
                잃어버린 반려동물을 찾을 때는 품종이나 지역만으로는 부족할 수 있습니다. <br />
                포유테일은 사진과 특징을 기반으로 비슷한 아이를 찾아주는 AI 검색 흐름을 설계해, <br />
                보호 공고 속 아이들과 사용자의 기억을 더 가깝게 연결합니다.
              </p>
            </div>

            <div className="mt-14 space-y-16 sm:mt-20 sm:space-y-24">
              {featureRows.map((row, index) => (
                <article
                  key={row.title}
                  className={`grid gap-8 border-t border-gray-200 pt-10 sm:pt-14 lg:grid-cols-2 lg:gap-16 ${index === 0 ? 'border-t-0 pt-0' : ''
                    }`}
                >
                  <div>
                    <p className="text-sm font-semibold tracking-[0.22em] text-primary1 uppercase">
                      {row.eyebrow}
                    </p>
                    <h3 className="mt-4 whitespace-pre-line text-3xl font-semibold tracking-[-0.04em] text-gray-950 sm:text-5xl">
                      {row.title}
                    </h3>
                  </div>
                  <div className="flex items-end">
                    <p className="max-w-xl text-base leading-8 text-gray-600 sm:text-lg">
                      {row.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-[2.5rem] bg-gray-950 px-6 py-14 text-white sm:px-10 sm:py-20 lg:px-16">
            <p className="text-sm font-semibold tracking-[0.22em] text-amber-300 uppercase">
              Built For Real Decisions
            </p>
            <h2 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              공고를 보는 순간에서 끝나지 않고,
              <br />
              실제 만남과 입양 결정으로 이어지도록.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-gray-300 sm:text-lg">
              포유테일은 유기동물 공고를 단순히 나열하는 데 그치지 않습니다.
              사용자가 아이의 상태를 확인하고, 보호소 정보를 살펴보고, 다른 사람들의 경험을 참고하며
              더 책임 있는 입양 결정을 할 수 있도록 돕습니다.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/shelter"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-gray-950 transition hover:bg-amber-100"
              >
                입양 공고 찾아보기
              </Link>
              <Link
                href="/animalShelter"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                가까운 보호소 보기
              </Link>
              <Link
                href="/community"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                이야기 나누기
              </Link>
            </div>
          </section>
        </section>
      </PageTemplate>
      <PageFooter />
    </main>
  );
}
