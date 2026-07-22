export interface ShelterInfoItem {
    id?: string;
    careNm?: string;
    careRegNo?: string;
    orgNm?: string;
    orgCd?: string;   // 시군구 코드
    uprCd?: string;   // 시도 코드
    divisionNm?: string;
    saveTrgtAnimal?: string;
    careAddr?: string;
    jibunAddr?: string;
    lat?: number;
    lng?: number;
    careTel?: string;
    dsignationDate?: string;
    weekOprStime?: string;
    weekOprEtime?: string;
    weekCellStime?: string;
    weekCellEtime?: string;
    weekendOprStime?: string;
    weekendOprEtime?: string;
    weekendCellStime?: string;
    weekendCellEtime?: string;
    closeDay?: string;
    vetPersonCnt?: number;
    specsPersonCnt?: number;
    medicalCnt?: number;
    breedCnt?: number;
    quarabtineCnt?: number;
    feedCnt?: number;
    dataStdDt?: string;
}
export interface SidoLocationItem {
    SIDO_CD: string;
    SIDO_NAME: string;
}


export interface Address {
    roadAddress: string;
    jibunAddress: string;
    level1: string; // 시/도
    level2: string; // 시/군/구
    level3: string; // 읍/면/동
    sidoCd?: string; // 매칭된 시도 코드
    sidoName?: string; // 매칭된 시도 이름
    latitude?: number; // 위도
    longitude?: number; // 경도
}
