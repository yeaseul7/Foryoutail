import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageTemplate from "@/packages/ui/components/base/PageTemplate";
import { ShelterInfoItem } from '@/packages/type/shelterTyps';
import { ShelterAnimalItem } from '@/packages/type/postType';
import dynamic from 'next/dynamic';
import ShelterInfoComponentSkeleton from '@/packages/ui/components/base/ShelterInfoComponentSkeleton';
import { decodeShelterId } from '@/lib/shelterId';

const ShelterInfoComponent = dynamic(
    () => import("@/packages/ui/components/home/shelterList/ShelterInfoComponent"),
    {
        ssr: true,
        loading: () => <ShelterInfoComponentSkeleton />
    }
);
import {
    getBaseUrl,
    generateMetadata as generateMetadataUtil,
    generateDefaultMetadata,
} from '@/packages/utils/metadata';
import PageFooter from '@/packages/ui/components/base/PageFooter';

interface AnimalShelterPageProps {
    params: Promise<{ id: string }>;
}

const baseUrl = getBaseUrl();

async function fetchShelterInfo(careRegNo: string): Promise<ShelterInfoItem | null> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const apiUrl = `${baseUrl}/api/shelter-info?care_reg_no=${careRegNo}`;

            // 타임아웃을 위한 AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

            const response = await fetch(apiUrl, {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(`보호소 정보 조회 실패 (시도 ${attempt}/${maxRetries}):`, response.status, response.statusText);
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    continue;
                }
                return null;
            }

            const data = await response.json();
            if (data?.response?.body?.items?.item) {
                const items = Array.isArray(data.response.body.items.item)
                    ? data.response.body.items.item
                    : [data.response.body.items.item];
                return items.length > 0 ? items[0] : null;
            }
            return null;
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            console.error(`보호소 정보 조회 오류 (시도 ${attempt}/${maxRetries}):`, lastError.message);

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
            }
        }
    }

    console.error('보호소 정보 조회 최종 실패:', lastError?.message);
    return null;
}

async function fetchShelterAnimals(careRegNo: string): Promise<ShelterAnimalItem[]> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const apiUrl = `${baseUrl}/api/shelter-data?care_reg_no=${careRegNo}&numOfRows=1000`;

            // 타임아웃을 위한 AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

            const response = await fetch(apiUrl, {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(`유기동물 정보 조회 실패 (시도 ${attempt}/${maxRetries}):`, response.status, response.statusText);
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    continue;
                }
                return [];
            }

            const data = await response.json();
            if (data?.response?.body?.items?.item) {
                const items = Array.isArray(data.response.body.items.item)
                    ? data.response.body.items.item
                    : [data.response.body.items.item];
                return items;
            }
            return [];
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            console.error(`유기동물 정보 조회 오류 (시도 ${attempt}/${maxRetries}):`, lastError.message);

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
            }
        }
    }

    console.error('유기동물 정보 조회 최종 실패:', lastError?.message);
    return [];
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const baseUrl = getBaseUrl();
    const pageUrl = `${baseUrl}/animalShelter/${id}`;

    const careRegNo = decodeShelterId(id);
    if (!careRegNo) {
        return generateDefaultMetadata(
            '보호소 정보 | 꼬순내',
            '보호소 정보 및 입양 대기 중인 친구들을 확인해보세요.',
            pageUrl,
            { type: 'website' },
        );
    }

    try {
        const shelter = await fetchShelterInfo(careRegNo);

        if (shelter) {
            const shelterName = shelter.careNm || '보호소';
            const title = `${shelterName} | 꼬순내`;

            let description = '';
            if (shelter.careAddr) {
                description = `${shelterName} - ${shelter.careAddr}. 입양 대기 중인 친구들을 만나보세요.`;
            } else {
                description = `${shelterName}에서 입양 대기 중인 친구들을 만나보세요.`;
            }

            return generateMetadataUtil({
                title,
                description,
                url: pageUrl,
                type: 'website',
                includeCanonical: true,
                includeTwitterCreator: true,
                imageAlt: shelterName,
            });
        }
    } catch (error) {
        console.error('메타데이터 생성 중 오류:', error);
    }

    return generateDefaultMetadata(
        '보호소 정보 | 꼬순내',
        '보호소 정보 및 입양 대기 중인 친구들을 확인해보세요.',
        pageUrl,
        {
            type: 'website',
        },
    );
}

export default async function AnimalShelterPage({ params }: AnimalShelterPageProps) {
    const { id } = await params;

    const careRegNo = decodeShelterId(id);
    if (!careRegNo) {
        notFound();
    }

    const [shelter, animals] = await Promise.all([
        fetchShelterInfo(careRegNo),
        fetchShelterAnimals(careRegNo),
    ]);

    return (
        <div className="w-full min-h-screen font-sans bg-white">
            <main className="flex flex-col justify-between items-center w-full min-h-screen bg-whitesm:items-start">
                <PageTemplate>
                    <ShelterInfoComponent shelter={shelter} animals={animals} />
                </PageTemplate>
                <PageFooter />
            </main>
        </div>
    );
}