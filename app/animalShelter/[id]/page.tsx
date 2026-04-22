import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageTemplate from "@/packages/ui/components/base/PageTemplate";
import { ShelterInfoItem } from '@/packages/type/shelterTyps';
import type {
    ShelterAnimalItem,
} from '@/packages/type/shelterAnimalTypes';
import { fetchShelterInfoByCareRegNo } from '@/lib/api/shelterInfo';
import ShelterInfoComponent from '@/packages/ui/components/home/shelterList/ShelterInfoComponent';
import { loadAllShelterAnimalsFromFirestore } from '@/lib/utils/shelterAnimalsFirestore';

import {
    getBaseUrl,
    generateMetadata as generateMetadataUtil,
    generateDefaultMetadata,
} from '@/packages/utils/metadata';
import PageFooter from '@/packages/ui/components/base/PageFooter';

export const runtime = 'edge';

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
        const suffix = `-${careRegNo}`;
        const animals = await loadAllShelterAnimalsFromFirestore();
        return animals
            .filter((item) => item.careRegNo === careRegNo || `${item.desertionNo}-${item.careRegNo}`.endsWith(suffix))
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
            '보호소 정보 | 포유테일',
            '보호소 정보 및 입양 대기 중인 친구들을 확인해보세요.',
            pageUrl,
            { type: 'website' },
        );
    }

    try {
        const shelter = await fetchShelterInfo(careRegNo);

        if (shelter) {
            const shelterName = shelter.careNm || '보호소';
            const title = `${shelterName} | 포유테일`;

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
        '보호소 정보 | 포유테일',
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
