'use client';

import { useParams } from 'next/navigation';
import PageTemplate from "@/packages/components/base/PageTemplate";
import { ShelterInfoItem } from '@/packages/type/shelterTyps';
import type {
    ShelterAnimalItem,
} from '@/packages/type/shelterAnimalTypes';
import { fetchShelterInfoByCareRegNo } from '@/lib/client/shelter-info';
import ShelterInfoComponent from '@/packages/components/home/shelterList/ShelterInfoComponent';
import PageFooter from '@/packages/components/base/PageFooter';
import { useEffect, useState } from 'react';
import Loading from '@/packages/components/base/Loading';
import { fetchShelterAnimals } from '@/lib/client/shelter-data';

export default function AnimalShelterPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;

    const careRegNo = (id ?? '').trim();
    const [shelter, setShelter] = useState<ShelterInfoItem | null>(null);
    const [animals, setAnimals] = useState<ShelterAnimalItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let ignore = false;

        async function loadData() {
            if (!careRegNo) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const [shelterData, animalData] = await Promise.all([
                    fetchShelterInfoByCareRegNo(careRegNo, { cache: 'no-store' }),
                    fetchShelterAnimals({
                        care_reg_no: careRegNo,
                        pageNo: 1,
                        numOfRows: 1000,
                    }),
                ]);

                if (!ignore) {
                    setShelter(shelterData);
                    setAnimals(animalData);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error('보호소 상세 조회 실패:', message);
                if (!ignore) {
                    setShelter(null);
                    setAnimals([]);
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        loadData();
        return () => {
            ignore = true;
        };
    }, [careRegNo]);

    return (
        <div className="w-full min-h-screen font-sans bg-white">
            <main className="flex flex-col justify-between items-center w-full min-h-screen bg-whitesm:items-start">
                <PageTemplate>
                    {loading ? <Loading /> : <ShelterInfoComponent shelter={shelter} animals={animals} />}
                </PageTemplate>
                <PageFooter />
            </main>
        </div>
    );
}
