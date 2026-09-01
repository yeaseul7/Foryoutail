/** 앱 전역에서 사용하는 camelCase 유기동물 공고 타입 */
export interface ShelterAnimalItem {
  id?: string;
  /** AI 이미지 검색 결과에서만 사용하는 유사도(0~1) */
  aiSimilarityScore?: number;
  desertionNo?: string; // 유기번호
  careRegNo?: string; // 보호소번호
  noticeNo?: string; // 공고번호
  noticeSdt?: string; // 공고시작일 (YYYYMMDD 등)
  noticeEdt?: string; // 공고종료일
  happenDt?: string; // 접수일시
  happenPlace?: string; // 발견장소
  processState?: string; // 표준 상태 코드: notice, protect, adopted, returned, ended
  kindCd?: string; // 품종코드
  kindNm?: string; // 품종명
  kindFullNm?: string; // 품종전체명
  upKindCd?: string; // 축종코드 (개 417000 등)
  upKindNm?: string; // 축종명
  colorCd?: string; // 색상
  age?: string; // 나이 (예: "2025(년생)")
  weight?: string; // 체중 (예: "14.6(Kg)")
  birthYear?: number;
  weightKg?: number;
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
 * Supabase `public.animals` 테이블 row 타입.
 * snake_case 컬럼과 nullable 제약을 그대로 반영합니다.
 */
export interface ShelterAnimalRow {
  id: string;
  desertion_no: string;
  care_reg_no: string | null;
  age: string | null;
  weight: string | null;
  birth_year: number | null;
  weight_kg: number | null;
  color_cd: string | null;
  sex_cd: string | null;
  neuter_yn: string | null;
  up_kind_nm: string | null;
  kind_nm: string | null;
  kind_full_nm: string | null;
  notice_no: string | null;
  notice_sdt: string | null;
  notice_edt: string | null;
  notice_start_date: string | null;
  notice_end_date: string | null;
  process_state: string | null;
  happen_dt: string | null;
  happened_date: string | null;
  happen_place: string | null;
  special_mark: string | null;
  popfiles: string[] | null;
  embedding: unknown;
  created_at: string | null;
  updated_at: string | null;
  rfid_cd: string | null;
  upd_tm: string | null;
  source_updated_at: string | null;
  end_reason: string | null;
  care_nm: string | null;
  care_tel: string | null;
  care_addr: string | null;
  org_nm: string | null;
  care_owner_nm: string | null;
  up_kind_cd: string | null;
  sfe_soci: string | null;
  sfe_health: string | null;
  etc_bigo: string | null;
  vaccination_chk: string | null;
  health_chk: string | null;
  adptn_title: string | null;
  adptn_s_date: string | null;
  adptn_e_date: string | null;
  adptn_condition_limit_txt: string | null;
  adptn_txt: string | null;
  adptn_img: string | null;
  sprt_title: string | null;
  sprt_s_date: string | null;
  sprt_e_date: string | null;
  sprt_condition_limit_txt: string | null;
  sprt_txt: string | null;
  sprt_img: string | null;
  srvc_title: string | null;
  srvc_s_date: string | null;
  srvc_e_date: string | null;
  srvc_condition_limit_txt: string | null;
  srvc_txt: string | null;
  srvc_img: string | null;
  evnt_title: string | null;
  evnt_s_date: string | null;
  evnt_e_date: string | null;
  evnt_condition_limit_txt: string | null;
  evnt_txt: string | null;
  evnt_img: string | null;
  kind_cd: string | null;
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
