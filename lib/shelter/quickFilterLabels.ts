import type { QuickFilterKey } from '@/lib/api/shelter';
import { MdChildCare, MdGroups, MdLocationOn, MdSentimentSatisfied } from 'react-icons/md';

/** 퀵 필터 표시 문구 (홈 히어로·입양 목록 요약 등 공통) */
export const QUICK_FILTER_LABEL: Record<QuickFilterKey, string> = {
  likesHuman: '사람 좋아해요',
  gentle: '순한 아이',
  nearby: '근처 보호소 공고',
  young: '어린 동물',
};

/** 퀵 필터 아이콘 (히어로 버튼·입양 목록 요약 칩 공통) */
export const QUICK_FILTER_ICONS: Record<QuickFilterKey, typeof MdGroups> = {
  likesHuman: MdGroups,
  gentle: MdSentimentSatisfied,
  nearby: MdLocationOn,
  young: MdChildCare,
};

/** 홈 히어로 퀵 버튼 순서 */
export const HOME_HERO_QUICK_FILTER_ORDER = [
  'likesHuman',
  'gentle',
  'nearby',
  'young',
] as const satisfies readonly QuickFilterKey[];

export const HOME_HERO_QUICK_FILTERS = HOME_HERO_QUICK_FILTER_ORDER.map((key) => ({
  key,
  label: QUICK_FILTER_LABEL[key],
}));
