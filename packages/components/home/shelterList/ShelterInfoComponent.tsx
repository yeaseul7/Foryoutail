'use client';
import { ShelterInfoItem } from '@/packages/type/shelterTyps';
import { ShelterAnimalItem } from '@/packages/type/postType';
import Link from 'next/link';
import { MdKeyboardArrowRight } from 'react-icons/md';
import OperationInfo from './OperationInfo';
import WaitingAnimalsByShelter from './WaitingAnimalsByShelter';
import AnimalNotice from '../../common/AnimalNotice';
import ShelterIntro from './ShelterIntro';
import { useState } from 'react';
import WatingAnimalCard from './WatingAnimalCard';
import { IoIosArrowBack } from 'react-icons/io';

interface ShelterInfoComponentProps {
    shelter: ShelterInfoItem | null;
    animals: ShelterAnimalItem[];
}

export default function ShelterInfoComponent({ shelter, animals }: ShelterInfoComponentProps) {
    const [showAllList, setShowAllList] = useState(false);

    if (!shelter) {
        return <div className="text-center text-gray-500">보호소 정보를 찾을 수 없습니다.</div>;
    }
    return (
        <div className="flex flex-col gap-6 px-4 py-4 mx-auto w-full sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
                <Link
                    href="/animalShelter"
                    className="hover:text-gray-900 transition-colors"
                >
                    보호소
                </Link>
                <span className="text-gray-400"><MdKeyboardArrowRight /></span>
                <span className="text-gray-900 font-medium">보호소 정보</span>
            </nav>
            {showAllList ? (
                <>
                    <button onClick={() => setShowAllList(false)} className="text-primary1 hover:text-primary2 font-bold hover:underline transition-colors self-start flex items-center gap-1">
                        <IoIosArrowBack className="w-4 h-4" />
                        돌아가기
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {animals.map((animal) => (
                            <WatingAnimalCard key={animal.desertionNo || animal.noticeNo} animal={animal} />
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">{shelter.careNm}</h1>
                        {shelter.divisionNm && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-300 px-3 py-1 text-xs font-medium text-blue-700">
                                {shelter.divisionNm}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 lg:flex-[3] flex flex-col gap-16">
                            <ShelterIntro shelterId={shelter.careRegNo || ''} />
                            {animals.length > 0 && (
                                <WaitingAnimalsByShelter animals={animals} shelterName={shelter.careNm || ''} setShowAllList={setShowAllList} />
                            )}
                        </div>

                        <div className="flex-1 lg:flex-[2] flex flex-col gap-4">
                            <OperationInfo shelter={shelter} />
                            <AnimalNotice shelterInfo={shelter} animalData={null} />
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}