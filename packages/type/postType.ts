import { Timestamp } from 'firebase/firestore';

/** 커뮤니티 글 카테고리 (탭 id와 동일). `pet-life`는 구 데이터 호환용 */
export type PostBoardCategory = 'daily' | 'question' | 'adoption';
export type PostCategoryStored = PostBoardCategory | 'pet-life';

export interface PostData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  thumbnail?: string | null; // 대표 이미지 (콘텐츠의 첫 번째 이미지)
  likes: number;
  category?: PostCategoryStored;
}

// 공공데이터포털 유기동물 API 응답 타입
export interface ShelterAnimalItem {
  noticeNo?: string; // 공고번호
  srvcTxt?: string; // 봉사안내 지원내용 및 신청방법
  popfile4?: string; // Image4
  sprtEDate?: string; // 입양지원 종료일
  desertionNo?: string; // 유기번호
  rfidCd?: string; // 동물등록번호(RFID 번호)
  happenDt?: string; // 접수일시
  happenPlace?: string; // 발견장소
  kindCd?: string; // 품종코드
  colorCd?: string; // 색상코드
  age?: string; // 나이
  weight?: string; // 체중
  evntImg?: string; // 이벤트 이미지
  updTm?: string; // 수정일시
  endReason?: string; // 종료사유
  careRegNo?: string; // 보호소번호
  noticeSdt?: string; // 공고시작일
  noticeEdt?: string; // 공고종료일
  popfile1?: string; // Image1
  processState?: string; // 상태
  sexCd?: string; // 성별코드
  neuterYn?: string; // 중성화여부
  specialMark?: string; // 특징
  careNm?: string; // 보호소명
  careTel?: string; // 보호소전화번호
  careAddr?: string; // 보호소주소
  orgNm?: string; // 관할기관명
  sfeSoci?: string; // 사회성
  sfeHealth?: string; // 건강상태
  etcBigo?: string; // 기타비고
  kindFullNm?: string; // 품종전체명
  upKindCd?: string; // 축종코드
  upKindNm?: string; // 축종명
  kindNm?: string; // 품종명
  popfile2?: string; // Image2
  popfile3?: string; // Image3
  popfile5?: string; // Image5
  popfile6?: string; // Image6
  popfile7?: string; // Image7
  popfile8?: string; // Image8
  careOwnerNm?: string; // 보호소담당자명
  vaccinationChk?: string; // 예방접종여부
  healthChk?: string; // 건강검진여부
  adptnTitle?: string; // 입양제목
  adptnSDate?: string; // 입양시작일
  adptnEDate?: string; // 입양종료일
  adptnConditionLimitTxt?: string; // 입양조건제한내용
  adptnTxt?: string; // 입양내용
  adptnImg?: string; // 입양이미지
  sprtTitle?: string; // 후원제목
  sprtSDate?: string; // 후원시작일
  sprtConditionLimitTxt?: string; // 후원조건제한내용
  sprtTxt?: string; // 후원내용
  sprtImg?: string; // 후원이미지
  srvcTitle?: string; // 봉사제목
  srvcSDate?: string; // 봉사시작일
  srvcEDate?: string; // 봉사종료일
  srvcConditionLimitTxt?: string; // 봉사조건제한내용
  srvcImg?: string; // 봉사이미지
  evntTitle?: string; // 이벤트제목
  evntSDate?: string; // 이벤트시작일
  evntEDate?: string; // 이벤트종료일
  evntConditionLimitTxt?: string; // 이벤트조건제한내용
  evntTxt?: string; // 이벤트내용
}

export interface ShelterAnimalItems {
  item?: ShelterAnimalItem | ShelterAnimalItem[]; // item은 단일 객체 또는 배열일 수 있음
}

export interface ShelterAnimalBody {
  items?: ShelterAnimalItems;
  numOfRows?: number;
  pageNo?: number;
  totalCount?: number;
}

export interface ShelterAnimalHeader {
  reqNo?: string; // 요청 고유 번호
  resultCode?: string; // 결과코드
  resultMsg?: string; // 결과메세지
  errorMsg?: string; // 오류 상세 내역
}

export interface AbandonmentPublicV2Response {
  header?: ShelterAnimalHeader;
  body?: ShelterAnimalBody;
}

export type ShelterAnimalData = AbandonmentPublicV2Response;