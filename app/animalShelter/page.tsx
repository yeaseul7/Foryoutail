import type { Metadata } from 'next';
import PageFooter from "@/packages/components/base/PageFooter";
import PageTemplate from "@/packages/components/base/PageTemplate";
import ShelterPosts from "@/packages/components/home/shelterList/ShelterPosts";
import { generateDefaultMetadata } from '@/packages/utils/metadata';

export const metadata: Metadata = generateDefaultMetadata(
    '전국 동물보호소 찾기',
    '전국 동물보호소 정보를 지역별로 확인하고, 가까운 보호소와 보호 중인 아이들을 포유테일에서 찾아보세요.',
    'https://www.kkosunnae.com/animalShelter',
    {
        includeCanonical: true,
    },
);

export default function AnimalShelter() {
    return (
        <div className="w-full min-h-screen font-sans bg-white">
            <main className="flex min-h-screen w-full flex-col items-center justify-between bg-white sm:items-start">
                <PageTemplate>
                    <div className="w-full">
                        <ShelterPosts />
                    </div>
                </PageTemplate>
                <PageFooter />
            </main>
        </div>
    );
}
