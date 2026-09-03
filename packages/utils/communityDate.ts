const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

export function formatCommunityPostDate(
  createdAt: string,
  locale: 'ko-KR' | 'en-US' = 'ko-KR',
): string {
  const createdTime = new Date(createdAt).getTime();
  const elapsed = Date.now() - createdTime;

  if (Number.isFinite(createdTime) && elapsed >= 0 && elapsed < ONE_DAY_MS) {
    const hours = Math.max(1, Math.floor(elapsed / ONE_HOUR_MS));
    return locale === 'en-US'
      ? `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
      : `${hours}시간 전`;
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: locale === 'ko-KR' ? 'long' : 'short',
    day: 'numeric',
  }).format(new Date(createdAt));
}
