'use client';

import { ShelterInfoItem } from '@/packages/type/shelterTyps';
import { IoLocationSharp, IoCall, IoTimeOutline } from 'react-icons/io5';
import ShelterMapComponent from './ShelterMapComponent';

interface ExtendedShelterInfoItem extends ShelterInfoItem {
    weekOprStime?: string; // 평일 운영 시작 시각
    weekOprEtime?: string; // 평일 운영 종료 시각
    weekCellStime?: string; // 평일 분양 시작 시각
    weekCellEtime?: string; // 평일 분양 종료 시각
    weekendOprStime?: string; // 주말 운영 시작 시각
    weekendOprEtime?: string; // 주말 운영 종료 시각
    weekendCellStime?: string; // 주말 분양 시작 시각
    weekendCellEtime?: string; // 주말 분양 종료 시각
}

interface OperationInfoProps {
    shelter: ExtendedShelterInfoItem;
}

export default function OperationInfo({ shelter }: OperationInfoProps) {
    // 운영 시간 포맷팅 (HHMM 형식을 HH:MM으로 변환, 이미 HH:MM 형식이면 그대로 사용)
    const formatTime = (time?: string) => {
        if (!time) return '';
        // 이미 HH:MM 형식인 경우
        if (time.includes(':')) {
            return time;
        }
        // HHMM 형식인 경우 변환
        if (time.length === 4) {
            return `${time.slice(0, 2)}:${time.slice(2, 4)}`;
        }
        return time;
    };


    const weekOprTime = (shelter.weekOprStime && shelter.weekOprEtime)
        ? `${formatTime(shelter.weekOprStime)} - ${formatTime(shelter.weekOprEtime)}`
        : null;

    const weekCellTime = (shelter.weekCellStime && shelter.weekCellEtime)
        ? `${formatTime(shelter.weekCellStime)} - ${formatTime(shelter.weekCellEtime)}`
        : null;

    // 주말 운영 시간
    const weekendOprTime = (shelter.weekendOprStime && shelter.weekendOprEtime)
        ? `${formatTime(shelter.weekendOprStime)} - ${formatTime(shelter.weekendOprEtime)}`
        : null;

    const weekendCellTime = (shelter.weekendCellStime && shelter.weekendCellEtime)
        ? `${formatTime(shelter.weekendCellStime)} - ${formatTime(shelter.weekendCellEtime)}`
        : null;

    // 점심시간 (평일 분양 시간으로 표시)
    const lunchTime = (shelter.weekCellStime && shelter.weekCellEtime &&
        shelter.weekCellStime !== '00:00' && shelter.weekCellEtime !== '00:00')
        ? `${formatTime(shelter.weekCellStime)} - ${formatTime(shelter.weekCellEtime)}`
        : null;

    return (
        <div className="bg-white rounded-3xl shadow-sm p-4 lg:p-8 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-gray-900">운영 정보</h2>

            {shelter.careAddr && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <IoLocationSharp className="w-4 h-4" />
                        <span>주소</span>
                    </div>
                    <p className="text-gray-900 font-bold" >{shelter.careAddr}</p>

                    {/* 지도 */}
                    {shelter.lat && shelter.lng && (
                        <div className="w-full h-64 rounded-3xl overflow-hidden relative">
                            <ShelterMapComponent
                                lat={shelter.lat}
                                lng={shelter.lng}
                                title={shelter.careNm}
                                address={shelter.careAddr}
                                height="256px"
                                zoom={16}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* 연락처 섹션 */}
            {shelter.careTel && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <IoCall className="w-4 h-4" />
                        <span>연락처</span>
                    </div>
                    <p className="text-gray-900">{shelter.careTel}</p>
                </div>
            )}

            {/* 운영 시간 섹션 */}
            {(weekOprTime || lunchTime) && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <IoTimeOutline className="w-4 h-4" />
                        <span>운영 시간</span>
                    </div>

                    <div className="flex flex-col gap-2">

                        {weekOprTime && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-900">평일 운영시간</span>
                                <span className="text-gray-900">{weekOprTime}</span>
                            </div>
                        )}


                        {weekendOprTime && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-900">주말 운영시간</span>
                                <span className="text-gray-900">{weekendOprTime}</span>
                            </div>
                        )}


                    </div>
                </div>
            )}
            {/* 분양 시간 섹션 */}
            {(weekCellTime || weekendCellTime) && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <IoTimeOutline className="w-4 h-4" />
                        <span>분양 시간</span>
                    </div>

                    <div className="flex flex-col gap-2">

                        {weekCellTime && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-900">평일 분양시간</span>
                                <span className="text-gray-900">{weekCellTime}</span>
                            </div>
                        )}


                        {weekendCellTime && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-900">주말 분양시간</span>
                                <span className="text-gray-900">{weekendCellTime}</span>
                            </div>
                        )}


                    </div>
                </div>
            )}

        </div>
    );
}
