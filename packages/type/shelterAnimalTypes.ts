import type { Timestamp } from 'firebase/firestore';

/**
 * Firestore `shelterAnimals` 컬렉션 문서 ID 규칙: `{desertionNo}-{careRegNo}`
 * (예: `411300202600109-311300201300001`)
 *
 * 본문 필드는 공공데이터포털 유기동물 API(v2)와 동일한 키를 기준으로 하며,
 * 지역 필터 등을 위해 `uprCd` / `orgCd`를 동기화 시 넣어두는 것을 권장합니다.
 */
export interface ShelterAnimalItem {
  desertionNo?: string; // 유기번호
  careRegNo?: string; // 보호소번호
  noticeNo?: string; // 공고번호
  noticeSdt?: string; // 공고시작일 (YYYYMMDD 등)
  noticeEdt?: string; // 공고종료일
  happenDt?: string; // 접수일시
  happenPlace?: string; // 발견장소
  processState?: string; // 상태 (예: 공고중, 보호중 / notice, protect)
  kindCd?: string; // 품종코드
  kindNm?: string; // 품종명
  kindFullNm?: string; // 품종전체명
  upKindCd?: string; // 축종코드 (개 417000 등)
  upKindNm?: string; // 축종명
  colorCd?: string; // 색상
  age?: string; // 나이 (예: "2025(년생)")
  weight?: string; // 체중 (예: "14.6(Kg)")
  sexCd?: string; // 성별 M/F/Q
  neuterYn?: string; // 중성화 Y/N/U
  specialMark?: string; // 특징
  rfidCd?: string; // 동물등록번호(RFID)
  updTm?: string; // 수정일시
  endReason?: string; // 종료사유
  careNm?: string; // 보호소명
  careTel?: string; // 보호소전화
  careAddr?: string; // 보호소주소
  careOwnerNm?: string; // 보호소 담당자명
  orgNm?: string; // 관할기관명
  /** 시도 코드 (필터·동기화용, 문서에 없을 수 있음) */
  uprCd?: string;
  /** 시군구 코드 */
  orgCd?: string;
  popfile?: string; // 일부 소스 대표 이미지 단일 필드
  popfile1?: string;
  popfile2?: string;
  popfile3?: string;
  popfile4?: string;
  popfile5?: string;
  popfile6?: string;
  popfile7?: string;
  popfile8?: string;
  evntImg?: string;
  srvcTxt?: string;
  sprtEDate?: string;
  sfeSoci?: string;
  sfeHealth?: string;
  etcBigo?: string;
  vaccinationChk?: string;
  healthChk?: string;
  adptnTitle?: string;
  adptnSDate?: string;
  adptnEDate?: string;
  adptnConditionLimitTxt?: string;
  adptnTxt?: string;
  adptnImg?: string;
  sprtTitle?: string;
  sprtSDate?: string;
  sprtConditionLimitTxt?: string;
  sprtTxt?: string;
  sprtImg?: string;
  srvcTitle?: string;
  srvcSDate?: string;
  srvcEDate?: string;
  srvcConditionLimitTxt?: string;
  srvcImg?: string;
  evntTitle?: string;
  evntSDate?: string;
  evntEDate?: string;
  evntConditionLimitTxt?: string;
  evntTxt?: string;
}

/**
 * Firestore에서 읽은 원시 문서 (`updatedAt` 등 서버 전용 필드 포함).
 * 클라이언트 컴포넌트 props로 넘기기 전에 타임스탬프 필드는 제거하는 것이 안전합니다.
 */
export interface ShelterAnimalFirestoreDoc extends ShelterAnimalItem {
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}

/** 공공데이터 API `items.item` — 단일 객체 또는 배열 */
export interface ShelterAnimalItems {
  item?: ShelterAnimalItem | ShelterAnimalItem[];
}

export interface ShelterAnimalBody {
  items?: ShelterAnimalItems;
  numOfRows?: number;
  pageNo?: number;
  totalCount?: number;
}

export interface ShelterAnimalHeader {
  reqNo?: string;
  resultCode?: string;
  resultMsg?: string;
  errorMsg?: string;
}

export interface AbandonmentPublicV2Response {
  header?: ShelterAnimalHeader;
  body?: ShelterAnimalBody;
}

export type ShelterAnimalData = AbandonmentPublicV2Response;
