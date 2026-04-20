'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { HiHeart, HiOutlineHeart } from 'react-icons/hi2';
import type { ShelterAnimalItem } from '@/packages/type/postType';
import getOptimizedCloudinaryUrl from '@/packages/utils/optimization';
import { useShelterLike } from '@/hooks/useShelterLike';
import { MdShare } from 'react-icons/md';

/** 720, 3.1k 형태 (참고 UI용) */
export function formatCompactLikeCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0';
  if (n < 1000) return String(Math.floor(n));
  if (n < 10_000) {
    const k = n / 1000;
    const rounded = Math.round(k * 10) / 10;
    const s = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    return `${s.replace(/\.0$/, '')}k`;
  }
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  const m = n / 1_000_000;
  const rounded = Math.round(m * 10) / 10;
  const s = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${s.replace(/\.0$/, '')}M`;
}

export const DISPLAY_COUNT = 15;

export function getFirstImageUrl(item: ShelterAnimalItem): string | null {
  for (let i = 1; i <= 8; i++) {
    const url = item[`popfile${i}` as keyof ShelterAnimalItem] as string | undefined;
    if (url && typeof url === 'string' && url.trim() !== '') return url;
  }
  return null;
}

function isNewNotice(item: ShelterAnimalItem): boolean {
  const sdt = item.noticeSdt || item.happenDt;
  if (!sdt) return false;
  const y = parseInt(sdt.slice(0, 4), 10);
  const m = parseInt(sdt.slice(4, 6), 10) - 1;
  const d = parseInt(sdt.slice(6, 8), 10);
  const noticeDate = new Date(y, m, d);
  const diffMs = Date.now() - noticeDate.getTime();
  return diffMs >= 0 && diffMs < 7 * 24 * 60 * 60 * 1000;
}

export function getShortRegion(item: ShelterAnimalItem): string {
  const src = item.orgNm || item.careAddr || '';
  const match = src.match(/([가-힣]+[시군구])/);
  return match ? match[1] : src.slice(0, 6) || '지역 미상';
}

export function getKindLabel(item: ShelterAnimalItem): string {
  const k = item.upKindCd || item.kindCd || '';
  if (k.includes('417000') || k.includes('개')) return '강아지';
  if (k.includes('422400') || k.includes('고양이')) return '고양이';
  return '기타';
}

function getSexLabel(item: ShelterAnimalItem): string {
  if (item.sexCd === 'M') return '수컷';
  if (item.sexCd === 'F') return '암컷';
  return '미상';
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/** `/shelter/{유기번호}` URL 복사 + 잠깐 복사됨 표시 — 카드 공유 버튼 공통 */
export function useShelterAnimalShareLink(desertionNo: string | undefined) {
  const [shareCopied, setShareCopied] = useState(false);

  const handleShareClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const id = desertionNo?.trim();
      if (!id || typeof window === 'undefined') return;
      const url = `${window.location.origin}/shelter/${id}`;
      const ok = await copyTextToClipboard(url);
      if (!ok) return;
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    },
    [desertionNo],
  );

  return { shareCopied, handleShareClick };
}

/** 이미지만(최근 인기 많은 아이 모음 등). 하단 좋아요 수 pill로 찜, 우상단 공유 */
export function HorizontalAnimalPhotoCard({
  item,
  likeCount,
}: {
  item: ShelterAnimalItem;
  /** Firestore 집계 등. 있으면 우하단 pill로 표시 */
  likeCount?: number;
}) {
  const router = useRouter();
  const { shareCopied, handleShareClick } = useShelterAnimalShareLink(item.desertionNo);
  const { isLiked, isUpdating, handleLike } = useShelterLike(item.desertionNo, item);
  const imageUrl = getFirstImageUrl(item);
  const displayUrl = imageUrl?.includes('res.cloudinary.com')
    ? getOptimizedCloudinaryUrl(imageUrl, 400, 500)
    : imageUrl || '/static/images/defaultDog.png';
  const region = getShortRegion(item);
  const breedLabel = item.kindNm?.trim() || getKindLabel(item);
  const likeTotal =
    typeof likeCount === 'number' && Number.isFinite(likeCount)
      ? Math.max(0, Math.floor(likeCount))
      : null;
  const showLikes = likeTotal !== null;
  const a11yLabel = showLikes
    ? `${breedLabel}, ${region}. 좋아요 ${likeTotal}회. 카드 클릭 시 상세, 하단 숫자로 관심 추가`
    : `${breedLabel}, ${region}. 상세 보기`;

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={a11yLabel}
      onClick={() => router.push(`/shelter/${item.desertionNo}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/shelter/${item.desertionNo}`);
        }
      }}
      className="flex-shrink-0 w-[220px] sm:w-[250px] mt-4 rounded-2xl overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.13)] transition-shadow duration-200 cursor-pointer focus:outline-none group"
    >
      <div className="relative w-full aspect-[4/5] bg-gray-100">
        <Image
          src={displayUrl}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="250px"
          unoptimized={displayUrl === '/static/images/defaultDog.png'}
          loading="lazy"
        />
        {item.desertionNo?.trim() ? (
          <div className="absolute top-2.5 right-2.5 z-10">
            <button
              type="button"
              aria-label={shareCopied ? '링크를 복사했습니다' : '공유 링크 복사'}
              onClick={handleShareClick}
              className={`w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors shadow-sm ${shareCopied ? 'bg-primary1/90 text-white' : 'bg-white/75 text-gray-600 hover:bg-white'
                }`}
            >
              <MdShare className="w-4 h-4" aria-hidden />
            </button>
          </div>
        ) : null}
        {showLikes && (
          <button
            type="button"
            aria-pressed={isLiked}
            aria-label={
              isLiked ? `관심 해제, 좋아요 ${likeTotal}회` : `관심 추가, 좋아요 ${likeTotal}회`
            }
            disabled={isUpdating}
            onClick={(e) => void handleLike(e)}
            className={`absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none shadow-sm backdrop-blur-[2px] tabular-nums transition-colors border-0 ${isLiked
              ? 'bg-black/65 text-white ring-1 ring-red-400/50'
              : 'bg-black/55 text-white hover:bg-black/70'
              } ${isUpdating ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
          >
            {isLiked ? (
              <HiHeart className="h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden />
            ) : (
              <HiOutlineHeart className="h-3.5 w-3.5 shrink-0 text-white" strokeWidth={2.25} aria-hidden />
            )}
            <span className="text-white">{formatCompactLikeCount(likeTotal)}</span>
          </button>
        )}
      </div>
    </article>
  );
}

export function HorizontalAnimalCard({ item }: { item: ShelterAnimalItem }) {
  const router = useRouter();
  const { shareCopied, handleShareClick } = useShelterAnimalShareLink(item.desertionNo);
  const { isLiked, isUpdating, handleLike } = useShelterLike(item.desertionNo, item);
  const imageUrl = getFirstImageUrl(item);
  const displayUrl = imageUrl?.includes('res.cloudinary.com')
    ? getOptimizedCloudinaryUrl(imageUrl, 400, 500)
    : imageUrl || '/static/images/defaultDog.png';
  const isNew = isNewNotice(item);
  const region = getShortRegion(item);
  const breedLabel = item.kindNm?.trim() || getKindLabel(item);
  const shelterLabel = item.careNm?.trim() || '';
  const sexLabel = getSexLabel(item);
  const age = item.age?.trim() || '-';

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/shelter/${item.desertionNo}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/shelter/${item.desertionNo}`);
        }
      }}
      className="flex-shrink-0 w-[220px] sm:w-[250px] mt-4 rounded-2xl overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] cursor-pointer focus:outline-none group"
    >
      <div className="relative w-full aspect-[4/5] bg-gray-100">
        <Image
          src={displayUrl}
          alt={item.desertionNo || '유기동물'}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="250px"
          unoptimized={displayUrl === '/static/images/defaultDog.png'}
          loading="lazy"
        />

        {isNew && (
          <span className="absolute top-2.5 left-2.5 bg-primary1 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide shadow-sm">
            NEW
          </span>
        )}

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <button
            type="button"
            aria-label="관심 동물 추가"
            onClick={(e) => handleLike(e)}
            disabled={isUpdating}
            className={`w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors shadow-sm ${isLiked ? 'bg-red-100 hover:bg-red-200' : 'bg-white/75 hover:bg-white'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLiked ? (
              <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
          {item.desertionNo?.trim() ? (
            <button
              type="button"
              aria-label={shareCopied ? '링크를 복사했습니다' : '공유 링크 복사'}
              onClick={handleShareClick}
              className={`w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors shadow-sm ${shareCopied ? 'bg-primary1/90 text-white' : 'bg-white/75 text-gray-600 hover:bg-white'
                }`}
            >
              <MdShare className="w-4 h-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div className="px-3 py-2.5">
        <div className="mb-2">
          <div className="flex items-start justify-between gap-1">
            <p className="text-[15px] font-bold text-gray-900 leading-snug truncate">
              {breedLabel}
            </p>
            <p className="text-[12px] text-gray-400 whitespace-nowrap shrink-0 pt-px">
              {region}
            </p>
          </div>
          {shelterLabel ? (
            <p className="text-[12px] text-gray-500 truncate mt-1" title={shelterLabel}>
              {shelterLabel}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1">
          <span className="text-[12px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5">
            {sexLabel}
          </span>
          <span className="text-[12px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5 truncate max-w-[80px]">
            {age}
          </span>
        </div>
      </div>
    </article>
  );
}
