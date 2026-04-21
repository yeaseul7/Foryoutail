import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageTemplate from "@/packages/ui/components/base/PageTemplate";
import { ShelterInfoItem } from '@/packages/type/shelterTyps';
import { ShelterAnimalItem } from '@/packages/type/postType';
import { fetchShelterInfoByCareRegNo } from '@/lib/api/shelterInfo';
import ShelterInfoComponent from '@/packages/ui/components/home/shelterList/ShelterInfoComponent';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';

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
    try {
        return await fetchShelterInfoByCareRegNo(careRegNo, { baseUrl, cache: 'no-store' });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('보호소 정보 조회 실패:', message);
        return null;
    }
}

async function fetchShelterAnimals(careRegNo: string): Promise<ShelterAnimalItem[]> {
    try {
        const snap = await getDocs(collection(firestore, 'shelterAnimals'));
        const suffix = `-${careRegNo}`;
        return snap.docs
            .filter((d) => d.id.endsWith(suffix))
            .map((d) => {
                const raw = d.data() as ShelterAnimalItem;
                const rest = { ...raw } as Record<string, unknown>;
                // Firestore Timestamp(updatedAt)는 Server->Client props로 직접 넘기지 않음
                delete rest.updatedAt;
                return {
                    ...rest,
                    desertionNo: raw.desertionNo || d.id.split('-')[0],
                    careRegNo,
                } as ShelterAnimalItem;
            })
            .sort((a, b) => {
                const aNum = parseInt(String(a.noticeSdt || a.happenDt || '0').replace(/\D/g, ''), 10) || 0;
                const bNum = parseInt(String(b.noticeSdt || b.happenDt || '0').replace(/\D/g, ''), 10) || 0;
                return bNum - aNum;
            });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('shelterAnimals 조회 실패:', message);
        return [];
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const baseUrl = getBaseUrl();
    const pageUrl = `${baseUrl}/animalShelter/${id}`;

    const careRegNo = (id ?? '').trim();
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

    const careRegNo = (id ?? '').trim();
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