'use client';

import { ShelterInfoItem } from "@/packages/type/shelterTyps";
import { ShelterAnimalItem } from "@/packages/type/postType";
import { FaPaw } from "react-icons/fa";
import { useLanguage } from '@/lib/i18n/language';
import { closedDayLabel } from '@/lib/i18n/animal-labels';

export default function ShelterOperationInfoComponent({ shelterInfo, animalData }: { shelterInfo: ShelterInfoItem | null, animalData: ShelterAnimalItem | null }) {
    const { isEnglish, t } = useLanguage();
    if (!shelterInfo) {
        return <div className="text-center text-gray-500">{t('입양 문의 정보를 찾을 수 없습니다.', 'Adoption contact information is unavailable.')}</div>;
    }
    return (
        <div className="flex flex-col gap-4 rounded-[14px] border border-primary1/20 bg-primary-soft p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <FaPaw className="w-5 h-5 text-primary1" />
                <h3 className="text-lg font-bold text-gray-900">{t('입양 문의', 'Adoption inquiry')}</h3>
            </div>
            <p className="text-sm text-gray-700">
                {t('입양 문의는 전화 문의를 통해 진행해주세요.', 'Please contact the shelter by phone about adoption.')}
            </p>

            {shelterInfo && (
                <div className="flex flex-col gap-3 mt-2">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        {isEnglish && (
                            <p className="mb-3 text-xs text-gray-500">
                                All times are in Korea Standard Time (KST, UTC+9).
                            </p>
                        )}
                        <div className="flex flex-col gap-2 text-sm">
                            {shelterInfo.weekOprStime && shelterInfo.weekOprEtime && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 min-w-[80px]">{t('평일 운영:', 'Weekdays:')}</span>
                                    <span className="text-gray-900">
                                        {shelterInfo.weekOprStime} ~ {shelterInfo.weekOprEtime}
                                    </span>
                                </div>
                            )}
                            {shelterInfo.weekCellStime && shelterInfo.weekCellEtime && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 min-w-[80px]">{t('평일 분양:', 'Weekday adoption:')}</span>
                                    <span className="text-gray-900">
                                        {shelterInfo.weekCellStime} ~ {shelterInfo.weekCellEtime}
                                    </span>
                                </div>
                            )}
                            {shelterInfo.weekendOprStime && shelterInfo.weekendOprEtime && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 min-w-[80px]">{t('주말 운영:', 'Weekends:')}</span>
                                    <span className="text-gray-900">
                                        {shelterInfo.weekendOprStime} ~ {shelterInfo.weekendOprEtime}
                                    </span>
                                </div>
                            )}
                            {shelterInfo.weekendCellStime && shelterInfo.weekendCellEtime && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 min-w-[80px]">{t('주말 분양:', 'Weekend adoption:')}</span>
                                    <span className="text-gray-900">
                                        {shelterInfo.weekendCellStime} ~ {shelterInfo.weekendCellEtime}
                                    </span>
                                </div>
                            )}
                            {shelterInfo.closeDay && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 min-w-[80px]">{t('휴무일:', 'Closed:')}</span>
                                    <span className="text-gray-900">
                                        {closedDayLabel(shelterInfo.closeDay, isEnglish)}
                                    </span>
                                </div>
                            )}
                        </div>

                    </div>

                    {(shelterInfo.careTel) && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex flex-col gap-2">
                                {shelterInfo.careTel && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-gray-600">{t('전화번호 1:', 'Phone 1:')}</span>
                                        <span className="text-sm text-gray-900">{shelterInfo.careTel}</span>
                                    </div>
                                )}
                                {animalData && (
                                    animalData?.careTel && animalData.careTel !== shelterInfo.careTel && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-600">{t('전화번호 2:', 'Phone 2:')}</span>
                                            <span className="text-sm text-gray-900">{animalData.careTel}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
