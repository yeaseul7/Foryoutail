'use client';

import { ShelterAnimalItem } from '@/packages/type/postType';
import { FaPaw } from 'react-icons/fa';
import WatingAnimalCard from './WatingAnimalCard';

interface WaitingAnimalsByShelterProps {
    animals: ShelterAnimalItem[];
    shelterName: string;
    setShowAllList: (showAllList: boolean) => void;
}

export default function WaitingAnimalsByShelter({ animals, shelterName, setShowAllList }: WaitingAnimalsByShelterProps) {
    const displayAnimals = animals.slice(0, 4);
    if (displayAnimals.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <FaPaw className="w-4 h-4 sm:w-5 sm:h-5 text-primary1" />
                        <h2 className="text-base sm:text-lg font-bold text-gray-900">입양 대기 중인 친구들</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">
                        현재 {shelterName}에서 가족을 기다리는 아이들입니다.
                    </p>
                </div>
                {animals.length > 4 && (
                    <button
                        onClick={() => {
                            setShowAllList(true);
                        }}
                        className="text-xs sm:text-sm text-primary1 font-bold hover:text-primary2 transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                        전체보기 <span>→</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayAnimals.map((animal) => {
                    return <WatingAnimalCard key={animal.desertionNo || animal.noticeNo} animal={animal} />
                })}
            </div>
        </div>
    );
}
