'use client';

import { useState, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  loadEmbedModel,
  isModelLoaded,
  EMBED_DIM,
  getImageEmbeddingFromResult,
  type SimilarMatch,
} from '@/lib/search-animal';
import { useAuth } from '@/lib/firebase/auth';
import { firestore } from '@/lib/firebase/firebase';
import type { AiSearchFiltersValues } from '@/packages/components/search-animals/AiSearchFilters';

const DAILY_LIMIT = 5;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const SEARCH_CACHE_KEY = 'kkosunnae_search_animal_cache';

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

/** lastAi 이후 24시간 지났거나 lastAi가 없으면 count 0, 아니면 todayAi 반환. lastAi는 횟수 업데이트 시에만 수정됨. */
async function getDailyAiUsage(uid: string): Promise<{ count: number }> {
  const userRef = doc(firestore, 'users', uid);
  const snap = await getDoc(userRef);
  const data = snap.data();
  const lastAi = typeof data?.lastAi === 'string' ? data.lastAi : '';
  const todayAi = typeof data?.todayAi === 'number' ? data.todayAi : 0;
  if (!lastAi) return { count: 0 };
  const lastTime = new Date(lastAi).getTime();
  if (Number.isNaN(lastTime) || Date.now() - lastTime >= TWENTY_FOUR_HOURS_MS) {
    return { count: 0 };
  }
  return { count: todayAi };
}

/** 검색 횟수만 증가시킬 때 호출. lastAi를 현재 시간(ISO)으로, todayAi를 newCount로 저장. */
async function incrementDailyAiUsage(uid: string): Promise<number> {
  const usage = await getDailyAiUsage(uid);
  const newCount = usage.count === 0 ? 1 : usage.count + 1;
  const userRef = doc(firestore, 'users', uid);
  await setDoc(
    userRef,
    { lastAi: new Date().toISOString(), todayAi: newCount },
    { merge: true }
  );
  return newCount;
}

export function useSearchAnimal() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState(isModelLoaded());
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
    try {
      await loadEmbedModel();
      setModelReady(true);
      setSearchError(null);
      return true;
    } catch (e) {
      console.error('[search-animal] 모델 로드 실패:', e);
      setSearchError(e instanceof Error ? e.message : '모델 로드 실패');
      return false;
    }
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
      const usage = await getDailyAiUsage(user.uid);
      if (usage.count >= DAILY_LIMIT) {
        setSearchError(`검색 횟수(${DAILY_LIMIT}회)를 모두 사용했습니다. 24시간이 지나면 다시 이용할 수 있습니다.`);
        return;
      }
      const newCount = await incrementDailyAiUsage(user.uid);
      setDailyAiUsed(newCount);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : '검색 횟수 확인에 실패했습니다.');
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    setSearchMatches(null);
    try {
      const extractor = await loadEmbedModel();
      const result = await extractor(previewUrl, { pool: false });
      const vector = getImageEmbeddingFromResult(result as { data?: Float32Array; dims?: number[] });
      if (!vector || vector.length !== EMBED_DIM) {
        setSearchError(
          vector
            ? `임베딩 차원이 인덱스와 맞지 않습니다. (${vector.length} ≠ ${EMBED_DIM})`
            : '이미지에서 벡터를 추출하지 못했습니다.'
        );
        setSearchLoading(false);
        return;
      }
      const res = await fetch('/api/search-animal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vector,
          topK: 24,
          sidoCd: filters.sidoCd ?? undefined,
          upKindCd: filters.petType || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSearchError(json.error ?? json.details ?? '검색에 실패했습니다.');
        setSearchLoading(false);
        return;
      }
      const matches = json.matches ?? [];
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
    getDailyAiUsage(user.uid).then(({ count }) => setDailyAiUsed(count)).catch(() => setDailyAiUsed(null));
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
