import type { Timestamp } from 'firebase/firestore';

// Timestamp 또는 일반 객체를 Date로 변환하는 헬퍼 함수
function toDate(
  timestamp: Timestamp | { seconds: number; nanoseconds: number } | null,
): Date | null {
  if (!timestamp) return null;

  // Timestamp 객체인 경우
  if (typeof (timestamp as Timestamp).toDate === 'function') {
    return (timestamp as Timestamp).toDate();
  }

  // 일반 객체 { seconds, nanoseconds }인 경우
  if (
    typeof timestamp === 'object' &&
    'seconds' in timestamp &&
    typeof timestamp.seconds === 'number'
  ) {
    return new Date(timestamp.seconds * 1000);
  }

  return null;
}
export const formatDateToKorean = (timestamp: string | undefined): string => {
  if (!timestamp) return '';
  return timestamp.replace(/(\d{4})(\d{2})(\d{2})/, '$1년 $2월 $3일');
};

export const formatDate = (
  timestamp: Timestamp | { seconds: number; nanoseconds: number } | null,
): string => {
  const date = toDate(timestamp);
  if (!date) return '';

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 0 ? '방금 전' : `${minutes}분 전`;
    }
    return `약 ${hours}시간 전`;
  } else if (days === 1) {
    return '어제';
  } else if (days < 7) {
    return `${days}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
};

// 날짜를 간단한 형식으로 포맷하는 함수 (예: 2024.01.01)
export const formatDateSimple = (
  timestamp: Timestamp | { seconds: number; nanoseconds: number } | null,
): string => {
  const date = toDate(timestamp);
  if (!date) return '';
  return date.toLocaleDateString('ko-KR');
};

// 메타데이터용 날짜 포맷 (예: 2023.10.24)
export const formatDateMeta = (
  timestamp: Timestamp | { seconds: number; nanoseconds: number } | null,
): string => {
  const date = toDate(timestamp);
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
};
