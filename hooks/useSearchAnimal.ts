'use client';

import { useState, useCallback, useEffect } from 'react';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import type { SimilarMatch } from '@/lib/search-animal/types';
import { useAuth } from '@/lib/firebase/auth';
import { firestore } from '@/lib/firebase/firebase';
import type { AiSearchFiltersValues } from '@/packages/components/search-animals/AiSearchFilters';
import { sidoLocation } from '@/static/data/sidoLocation';

const DAILY_LIMIT = 5;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const SEARCH_CACHE_KEY = 'kkosunnae_search_animal_cache';
const AI_SEARCH_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8081/api/search/animals'
    : 'https://kkosunnae-backend-258374777454.asia-northeast3.run.app/api/search/animals';
const DEFAULT_TOP_K = 24;
const FILTERED_TOP_K = 50;

interface SearchCache {
  searchMatches: SimilarMatch[];
  filters: AiSearchFiltersValues;
}

function readSearchCache(): SearchCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SEARCH_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SearchCache;
    if (!Array.isArray(data?.searchMatches)) return null;
    return {
      searchMatches: data.searchMatches,
      filters: data.filters && typeof data.filters === 'object'
        ? { sidoCd: data.filters.sidoCd ?? null, petType: data.filters.petType ?? '' }
        : { sidoCd: null, petType: '' },
    };
  } catch {
    return null;
  }
}

function writeSearchCache(searchMatches: SimilarMatch[], filters: AiSearchFiltersValues) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify({ searchMatches, filters }));
  } catch {
    // ignore
  }
}

function getSidoNameByCode(sidoCd: string | null): string | null {
  if (!sidoCd) return null;
  const item = sidoLocation.items.find((i) => i.SIDO_CD === sidoCd);
  return item?.SIDO_NAME ?? null;
}

function applyAiSearchFilters(
  matches: SimilarMatch[],
  filters: AiSearchFiltersValues
): SimilarMatch[] {
  const sidoName = getSidoNameByCode(filters.sidoCd);
  return matches.filter((match) => {
    if (sidoName) {
      const orgNm = match.metadata?.orgNm;
      const orgName = typeof orgNm === 'string' ? orgNm : orgNm == null ? '' : String(orgNm);
      if (!orgName.includes(sidoName)) return false;
    }

    if (filters.petType) {
      const upKindCd = match.metadata?.upKindCd;
      const code = typeof upKindCd === 'string' ? upKindCd : upKindCd == null ? '' : String(upKindCd);
      if (code !== filters.petType) return false;
    }

    return true;
  });
}

/** lastAi 이후 24시간 지났거나 lastAi가 없으면 기본 사용 가능 횟수, 아니면 서버의 todayAi 반환 */
async function getDailyAiRemaining(uid: string): Promise<number> {
  const userRef = doc(firestore, 'users', uid);
  const snap = await getDocFromServer(userRef);
  const data = snap.data();
  const lastAi = typeof data?.lastAi === 'string' ? data.lastAi : '';
  const todayAi = typeof data?.todayAi === 'number' ? data.todayAi : DAILY_LIMIT;
  if (!lastAi) return DAILY_LIMIT;
  const lastTime = new Date(lastAi).getTime();
  if (Number.isNaN(lastTime) || Date.now() - lastTime >= TWENTY_FOUR_HOURS_MS) {
    return DAILY_LIMIT;
  }
  return Math.min(DAILY_LIMIT, Math.max(0, todayAi));
}

/** 검색 횟수 차감. lastAi를 현재 시간(ISO)으로, todayAi를 남은 횟수로 저장. */
async function decrementDailyAiRemaining(uid: string): Promise<number> {
  const remaining = await getDailyAiRemaining(uid);
  const newRemaining = Math.max(0, remaining - 1);
  const userRef = doc(firestore, 'users', uid);
  await setDoc(
    userRef,
    { lastAi: new Date().toISOString(), todayAi: newRemaining },
    { merge: true }
  );
  return newRemaining;
}

export function useSearchAnimal() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modelReady] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMatches, setSearchMatches] = useState<SimilarMatch[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dailyAiUsed, setDailyAiUsed] = useState<number | null>(null);
  const [filters, setFilters] = useState<AiSearchFiltersValues>({
    sidoCd: null,
    petType: '',
  });

  useEffect(() => {
    const cache = readSearchCache();
    if (cache && cache.searchMatches.length > 0) {
      setSearchMatches(cache.searchMatches);
      setFilters(cache.filters);
    }
  }, []);

  const loadModel = useCallback(async () => {
    setSearchError(null);
    return true;
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(file ?? null);
    setSearchMatches(null);
    setSearchError(null);
    if (file) setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl]);

  const runSearch = useCallback(async () => {
    if (!selectedFile || !previewUrl) return;
    if (!user) {
      setSearchError('AI 검색을 이용하려면 로그인이 필요합니다.');
      return;
    }
    try {
      const remaining = await getDailyAiRemaining(user.uid);
      if (remaining <= 0) {
        setSearchError(`검색 횟수(${DAILY_LIMIT}회)를 모두 사용했습니다. 24시간이 지나면 다시 이용할 수 있습니다.`);
        return;
      }
      const newRemaining = await decrementDailyAiRemaining(user.uid);
      setDailyAiUsed(DAILY_LIMIT - newRemaining);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : '검색 횟수 확인에 실패했습니다.');
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    setSearchMatches(null);
    try {
      const formData = new FormData();
      const hasFilters = Boolean(filters.sidoCd || filters.petType);
      formData.append('file', selectedFile);
      formData.append('topK', String(hasFilters ? FILTERED_TOP_K : DEFAULT_TOP_K));

      const res = await fetch(AI_SEARCH_URL, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setSearchError(json.error ?? json.details ?? '검색에 실패했습니다.');
        setSearchLoading(false);
        return;
      }
      const rawMatches = Array.isArray(json.matches) ? json.matches as SimilarMatch[] : [];
      const matches = applyAiSearchFilters(rawMatches, filters).slice(0, DEFAULT_TOP_K);
      setSearchMatches(matches);
      writeSearchCache(matches, filters);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : '검색 중 오류가 발생했습니다.');
    } finally {
      setSearchLoading(false);
    }
  }, [user, selectedFile, previewUrl, filters]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!user?.uid) {
      setDailyAiUsed(null);
      return;
    }
    getDailyAiRemaining(user.uid)
      .then((remaining) => setDailyAiUsed(DAILY_LIMIT - remaining))
      .catch(() => setDailyAiUsed(null));
  }, [user?.uid]);

  return {
    selectedFile,
    previewUrl,
    modelReady,
    searchLoading,
    searchMatches,
    searchError,
    dailyAiUsed,
    dailyLimit: DAILY_LIMIT,
    filters,
    setFilters,
    loadModel,
    onFileChange,
    runSearch,
  };
}
