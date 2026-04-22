import { ShelterInfoItem } from "@/packages/type/shelterTyps";
import { ShelterAnimalItem } from "@/packages/type/postType";
import { FaPaw } from "react-icons/fa";

export default function ShelterOperationInfoComponent({ shelterInfo, animalData }: { shelterInfo: ShelterInfoItem | null, animalData: ShelterAnimalItem | null }) {
    if (!shelterInfo) {
        return <div className="text-center text-gray-500">입양 문의 정보를 찾을 수 없습니다.</div>;
    }
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <FaPaw className="w-5 h-5 text-primary1" />
                <h3 className="text-lg font-bold text-gray-900">입양 문의</h3>
            </div>
            <p className="text-sm text-gray-700">
                입양 문의는 전화 문의를 통해 진행해주세요.
            </p>

            {shelterInfo && (
                <div className="flex flex-col gap-3 mt-2">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">운영 시간</h4>
                        <div className="flex flex-col gap-2 text-sm">
                            {shelterInfo.weekOprStime && shelterInfo.weekOprEtime && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 min-w-[80px]">평일 운영:</span>
                                    <span className="text-gray-900">
                                        {shelterInfo.weekOprStime} ~ {shelterInfo.weekOprEtime}
                                    </span>
                                </div>
                            )}
                            {shelterInfo.weekCellStime && shelterInfo.weekCellEtime && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 min-w-[80px]">평일 분양:</span>
                                    <span className="text-gray-900">
                                        {shelterInfo.weekCellStime} ~ {shelterInfo.weekCellEtime}
                                    </span>
                                </div>
                            )}
                            {shelterInfo.weekendOprStime && shelterInfo.weekendOprEtime && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 min-w-[80px]">주말 운영:</span>
                                    <span className="text-gray-900">
                                        {shelterInfo.weekendOprStime} ~ {shelterInfo.weekendOprEtime}
                                    </span>
                                </div>
                            )}
                            {shelterInfo.weekendCellStime && shelterInfo.weekendCellEtime && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 min-w-[80px]">주말 분양:</span>
                                    <span className="text-gray-900">
                                        {shelterInfo.weekendCellStime} ~ {shelterInfo.weekendCellEtime}
                                    </span>
                                </div>
                            )}
                            {shelterInfo.closeDay && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 min-w-[80px]">휴무일:</span>
                                    <span className="text-gray-900">
                                        {shelterInfo.closeDay === '0' ? '없음' :
                                            shelterInfo.closeDay === '1' ? '월요일' :
                                                shelterInfo.closeDay === '2' ? '화요일' :
                                                    shelterInfo.closeDay === '3' ? '수요일' :
                                                        shelterInfo.closeDay === '4' ? '목요일' :
                                                            shelterInfo.closeDay === '5' ? '금요일' :
                                                                shelterInfo.closeDay === '6' ? '토요일' :
                                                                    shelterInfo.closeDay === '7' ? '일요일' :
                                                                        shelterInfo.closeDay}
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
                                        <span className="text-sm font-semibold text-gray-600">전화번호 1:</span>
                                        <span className="text-sm text-gray-900">{shelterInfo.careTel}</span>
                                    </div>
                                )}
                                {animalData && (
                                    animalData?.careTel && animalData.careTel !== shelterInfo.careTel && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-600">전화번호 2:</span>
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