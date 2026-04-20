import type { PostBoardCategory } from '@/packages/type/postType';

/** 추천 칩·비교용: 앞의 `#` 제거 후 코어 텍스트 */
export function stripTagHashes(s: string): string {
  return String(s).trim().replace(/^#+\s*/, '');
}

/** 저장 시 항상 앞에 `#` 한 번 붙임 (입력·추천 모두 동일 규칙) */
export function toStoredTagWithHash(raw: string): string {
  const core = stripTagHashes(raw);
  if (!core) return '';
  return `#${core}`;
}

export const BOARD_SUGGESTED_TAGS: Record<PostBoardCategory, readonly string[]> = {
  daily: ['#산책', '#일상', '#간식', '#자랑'],
  question: ['#초보견주', '#사료추천', '#훈련방법', '#병원추천'],
  adoption: ['#첫만남', '#입양성공', '#사랑해', '#사지말고입양하세요'],
};
