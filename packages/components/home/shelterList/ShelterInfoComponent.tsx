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
import { IoCall, IoNavigate } from 'react-icons/io5';

interface ShelterInfoComponentProps {
    shelter: ShelterInfoItem | null;
    animals: ShelterAnimalItem[];
}

function formatTime(time?: string) {
    if (!time) return '';
    if (time.includes(':')) return time;
    if (time.length === 4) return `${time.slice(0, 2)}:${time.slice(2, 4)}`;
    return time;
}

export default function ShelterInfoComponent({ shelter, animals }: ShelterInfoComponentProps) {
    const [showAllList, setShowAllList] = useState(false);

    if (!shelter) {
        return <div className="text-center text-gray-500">보호소 정보를 찾을 수 없습니다.</div>;
    }

    const directionHref = shelter.careAddr
        ? `https://map.naver.com/p/search/${encodeURIComponent(shelter.careAddr)}`
        : null;

    const summaryItems = [
        shelter.saveTrgtAnimal ? shelter.saveTrgtAnimal.replace(/\+/g, '/') + ' 보호' : null
    ].filter(Boolean);

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
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div className="flex min-w-0 flex-col gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">{shelter.careNm}</h1>
                                {(shelter.orgNm || shelter.divisionNm) && (
                                    <p className="text-sm font-medium text-gray-700">
                                        {shelter.orgNm}
                                        {shelter.divisionNm ? ` [${shelter.divisionNm} 보호소]` : ''}
                                    </p>
                                )}
                                {summaryItems.length > 0 && (
                                    <p className="text-sm text-gray-500">{summaryItems.join(' · ')}</p>
                                )}
                            </div>

                            {(shelter.careTel || directionHref) && (
                                <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0 lg:self-end">
                                    {directionHref && (
                                        <a
                                            href={directionHref}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:border-primary1/30 hover:bg-primary1/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary1/30"
                                        >
                                            <IoNavigate className="h-4 w-4" aria-hidden />
                                            <span>길찾기</span>
                                        </a>
                                    )}
                                    {shelter.careTel && (
                                        <a
                                            href={`tel:${shelter.careTel.replace(/\s+/g, '')}`}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary1 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary1/30"
                                        >
                                            <IoCall className="h-4 w-4" aria-hidden />
                                            <span>전화하기</span>
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 lg:flex-[3] flex flex-col gap-4">
                            {animals.length > 0 && (
                                <WaitingAnimalsByShelter animals={animals} shelterName={shelter.careNm || ''} setShowAllList={setShowAllList} />
                            )}
                            <ShelterIntro shelterId={shelter.careRegNo || ''} />
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
