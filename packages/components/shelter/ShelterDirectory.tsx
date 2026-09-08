'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MdChevronLeft, MdChevronRight, MdLocationOn, MdMyLocation, MdSearch } from 'react-icons/md';
import type { ShelterInfoItem } from '@/packages/type/shelterTyps';
import { useLanguage } from '@/lib/i18n/language';
import { sidoLocation } from '@/static/data/sidoLocation';
import { createShelterSlug } from '@/lib/shelter/shelterSlug';

interface ShelterInfoResponse {
  response?: {
    body?: {
      items?: { item?: ShelterInfoItem[] };
      totalCount?: number;
    };
  };
  error?: string;
  districts?: string[];
}

const PAGE_SIZE = 20;
const DEFAULT_LOCATION = { lat: 37.4, lng: 127.08 };

function shortSidoName(name: string): string {
  return name.replace(/(특별자치도|특별자치시|특별시|광역시)$/, '');
}
const SHELTER_DIRECTORY_CACHE_KEY = 'matchichi:shelter-directory-state';
const SHELTER_DIRECTORY_RETURN_KEY = 'matchichi:returning-from-shelter-detail';

interface ShelterDirectoryCache {
  query: string;
  appliedQuery: string;
  region: string;
  district: string;
  districts: string[];
  protectedStatus: string;
  items: ShelterInfoItem[];
  page: number;
  totalCount: number;
  location: { lat: number; lng: number };
  scrollY: number;
}

const LEGACY_SIDO_NAMES: Record<string, string> = {
  강원도: '강원특별자치도',
  전라북도: '전북특별자치도',
};

function getShelterSidoCode(item: ShelterInfoItem | undefined): string {
  if (!item) return '';
  const address = (item.careAddr || item.jibunAddr || item.orgNm || '').trim();
  const firstPart = address.split(/\s+/)[0] || '';
  const normalizedName = LEGACY_SIDO_NAMES[firstPart] || firstPart;
  return sidoLocation.items.find((sido) => sido.SIDO_NAME === normalizedName)?.SIDO_CD || '';
}

export default function ShelterDirectory() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [districts, setDistricts] = useState<string[]>([]);
  const locationRef = useRef(DEFAULT_LOCATION);
  const [locating, setLocating] = useState(false);
  const [protectedStatus, setProtectedStatus] = useState('');
  const [items, setItems] = useState<ShelterInfoItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const initializedRef = useRef(false);

  const load = useCallback(async (nextPage: number, keyword: string, uprCd: string, districtName: string, status: string, currentLocation = locationRef.current) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ pageNo: String(nextPage), numOfRows: String(PAGE_SIZE) });
      if (keyword) params.set('q', keyword);
      if (uprCd) params.set('upr_cd', uprCd);
      if (districtName) params.set('district', districtName);
      if (status) params.set('protected_status', status);
      params.set('lat', String(currentLocation.lat));
      params.set('lng', String(currentLocation.lng));
      const response = await fetch(`/api/shelter-info?${params}`, { cache: 'no-store' });
      const body = await response.json().catch(() => null) as ShelterInfoResponse | null;
      if (!response.ok) throw new Error(body?.error || t('보호소를 불러오지 못했습니다.', 'Could not load shelters.'));
      setItems(body?.response?.body?.items?.item ?? []);
      setTotalCount(body?.response?.body?.totalCount ?? 0);
      setPage(nextPage);
    } catch (loadError) {
      setItems([]);
      setTotalCount(0);
      setError(loadError instanceof Error ? loadError.message : t('보호소를 불러오지 못했습니다.', 'Could not load shelters.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    try {
      const raw = sessionStorage.getItem(SHELTER_DIRECTORY_CACHE_KEY);
      const cache = raw ? JSON.parse(raw) as ShelterDirectoryCache : null;
      if (cache) {
        const shouldRestoreScroll = sessionStorage.getItem(SHELTER_DIRECTORY_RETURN_KEY) === '1';
        sessionStorage.removeItem(SHELTER_DIRECTORY_CACHE_KEY);
        sessionStorage.removeItem(SHELTER_DIRECTORY_RETURN_KEY);
        setQuery(cache.query);
        setAppliedQuery(cache.appliedQuery);
        setRegion(cache.region);
        setDistrict(cache.district);
        setDistricts(cache.districts);
        setProtectedStatus(cache.protectedStatus);
        setItems(cache.items);
        setPage(cache.page);
        setTotalCount(cache.totalCount);
        locationRef.current = cache.location;
        setLoading(false);
        if (shouldRestoreScroll) {
          requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: cache.scrollY, behavior: 'auto' })));
        }
        return;
      }
    } catch {
      sessionStorage.removeItem(SHELTER_DIRECTORY_CACHE_KEY);
    }
    void load(1, '', '', '', '', DEFAULT_LOCATION);
  }, [load]);

  const persistDirectoryState = () => {
    const cache: ShelterDirectoryCache = {
      query, appliedQuery, region, district, districts, protectedStatus,
      items, page, totalCount, location: locationRef.current, scrollY: window.scrollY,
    };
    sessionStorage.setItem(SHELTER_DIRECTORY_CACHE_KEY, JSON.stringify(cache));
    sessionStorage.setItem(SHELTER_DIRECTORY_RETURN_KEY, '1');
    sessionStorage.setItem('matchichi:adoption-search-mode', 'shelters');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const keyword = query.trim();
    setAppliedQuery(keyword);
    void load(1, keyword, region, district, protectedStatus);
  };
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const selectNearbyRegion = async (currentLocation: { lat: number; lng: number }) => {
    const params = new URLSearchParams({
      pageNo: '1',
      numOfRows: '1',
      lat: String(currentLocation.lat),
      lng: String(currentLocation.lng),
    });
    const response = await fetch(`/api/shelter-info?${params}`, { cache: 'no-store' });
    if (!response.ok) return '';
    const body = await response.json().catch(() => null) as ShelterInfoResponse | null;
    const nearbyShelter = body?.response?.body?.items?.item?.[0];
    return getShelterSidoCode(nearbyShelter);
  };

  return (
    <section className="w-full pb-4 pt-4 sm:pb-5 sm:pt-5">
      <div className="flex flex-col gap-2 py-2">
        <form onSubmit={submit} className="mx-auto flex min-h-[54px] w-full max-w-2xl items-center gap-2 rounded-full border border-primary1/40 bg-white px-3 transition focus-within:border-primary1 focus-within:ring-2 focus-within:ring-primary1/15 sm:px-5">
          <Image src="/static/images/findme-app-icon.png" alt="" width={28} height={28} className="hidden h-7 w-7 shrink-0 object-contain sm:block" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('보호소명 또는 주소를 검색해보세요', 'Search by shelter name or address')} className="h-12 min-w-0 flex-1 bg-transparent py-2 text-sm text-[#332d2a] outline-none placeholder:text-[#a69d98] sm:text-base" />
          <button type="submit" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary1 transition hover:bg-primary-soft" aria-label={t('보호소 검색', 'Search shelters')}><MdSearch className="h-5 w-5" /></button>
        </form>
        <div className="mx-auto flex w-full max-w-4xl flex-col items-stretch gap-3">
          <div className="flex flex-wrap justify-center gap-1.5" aria-label={t('시도 선택', 'Select province')}>
            {[{ SIDO_CD: '', SIDO_NAME: t('전국', 'All Korea') }, ...sidoLocation.items].map((sido) => {
              const selected = region === sido.SIDO_CD;
              return <button key={sido.SIDO_CD || 'all'} type="button" aria-pressed={selected} onClick={() => {
                setRegion(sido.SIDO_CD);
                setDistrict('');
                if (sido.SIDO_CD) {
                  void fetch(`/api/shelter-info?districts=1&upr_cd=${sido.SIDO_CD}`)
                    .then((response) => response.json() as Promise<ShelterInfoResponse>)
                    .then((body) => setDistricts(body.districts ?? []))
                    .catch(() => setDistricts([]));
                } else {
                  setDistricts([]);
                }
                void load(1, appliedQuery, sido.SIDO_CD, '', protectedStatus);
              }} className={`rounded-full border px-2.5 py-1.5 text-xs font-bold transition sm:px-3.5 sm:py-2 sm:text-sm ${selected ? 'border-primary1 bg-primary1 text-white' : 'border-[#eadfd7] bg-white text-[#5f5752] hover:border-primary1/40 hover:bg-primary-soft'}`}>{sido.SIDO_CD ? shortSidoName(sido.SIDO_NAME) : sido.SIDO_NAME}</button>;
            })}
          </div>
          {region && districts.length > 0 && <div className="flex flex-wrap justify-center gap-1.5 rounded-xl bg-primary-soft/50 p-3" aria-label={t('시군구 선택', 'Select district')}>
            {[t('전체', 'All'), ...districts].map((name, index) => {
              const value = index === 0 ? '' : name;
              const selected = district === value;
              return <button key={value || 'all-districts'} type="button" aria-pressed={selected} onClick={() => {
                setDistrict(value);
                void load(1, appliedQuery, region, value, protectedStatus);
              }} className={`rounded-full px-2.5 py-1 text-xs font-semibold transition sm:px-3 sm:py-1.5 sm:text-sm ${selected ? 'bg-primary-soft text-primary1' : 'text-[#817873] hover:bg-[#faf8f7]'}`}>{name}</button>;
            })}
          </div>}
        </div>
      </div>

      <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="relative grid w-full grid-cols-3 rounded-lg bg-[#f2efed] p-1 text-xs font-bold text-[#817873] sm:max-w-[288px]" role="group" aria-label={t('보호 동물 유무', 'Animals in care')}>
        <span
          className="pointer-events-none absolute bottom-1 left-1 top-1 w-[calc((100%_-_0.5rem)/3)] rounded-md bg-white shadow-sm transition-transform duration-200 ease-out"
          style={{ transform: `translateX(${protectedStatus === 'yes' ? '100%' : protectedStatus === 'no' ? '200%' : '0'})` }}
          aria-hidden
        />
        {[
          { value: '', label: t('전체', 'All') },
          { value: 'yes', label: t('보호동물 있음', 'In care') },
          { value: 'no', label: t('보호동물 없음', 'None') },
        ].map((option) => (
          <button
            key={option.value || 'all'}
            type="button"
            aria-pressed={protectedStatus === option.value}
            onClick={() => {
              setProtectedStatus(option.value);
              void load(1, appliedQuery, region, district, option.value);
            }}
            className={`relative z-10 flex h-8 min-w-0 items-center justify-center whitespace-nowrap px-1 text-center transition-colors ${protectedStatus === option.value ? 'text-primary1' : 'hover:text-[#332d2a]'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={locating}
        onClick={() => {
          if (!navigator.geolocation) {
            setRegion('');
            setDistrict('');
            setDistricts([]);
            void load(1, appliedQuery, '', '', protectedStatus);
            return;
          }
          setLocating(true);
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const nextLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
              locationRef.current = nextLocation;
              try {
                const nearbyRegion = await selectNearbyRegion(nextLocation);
                setRegion(nearbyRegion);
                setDistrict('');
                if (nearbyRegion) {
                  void fetch(`/api/shelter-info?districts=1&upr_cd=${nearbyRegion}`)
                    .then((response) => response.json() as Promise<ShelterInfoResponse>)
                    .then((body) => setDistricts(body.districts ?? []))
                    .catch(() => setDistricts([]));
                } else {
                  setDistricts([]);
                }
                await load(1, appliedQuery, nearbyRegion, '', protectedStatus, nextLocation);
              } catch {
                setRegion('');
                setDistrict('');
                setDistricts([]);
                await load(1, appliedQuery, '', '', protectedStatus, nextLocation);
              } finally {
                setLocating(false);
              }
            },
            () => {
              setRegion('');
              setDistrict('');
              setDistricts([]);
              void load(1, appliedQuery, '', '', protectedStatus).finally(() => setLocating(false));
            },
            { enableHighAccuracy: true, timeout: 10000 },
          );
        }}
        className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-3 text-xs font-bold text-[#5f5752] shadow-sm transition hover:bg-primary-soft hover:text-primary1 disabled:opacity-50 sm:w-auto sm:text-sm"
      >
        <MdMyLocation className={`h-4 w-4 text-primary1 ${locating ? 'animate-pulse' : ''}`} aria-hidden />
        {locating ? t('위치 확인 중', 'Locating') : t('내 주변 보호소 찾기', 'Find nearby shelters')}
      </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-[#f4f1ef]" />) : items.map((shelter) => {
          const address = shelter.careAddr || shelter.jibunAddr || '';
          return (
            <article key={shelter.id || shelter.careRegNo} className="relative flex min-w-0 flex-col rounded-2xl border border-[#eadfd7] bg-white p-4 shadow-sm transition hover:border-primary1/40 hover:bg-[#fffdfb]">
              {shelter.careRegNo && <Link href={`/shelters/${createShelterSlug(shelter.careNm, shelter.careRegNo)}`} onClick={persistDirectoryState} className="absolute inset-0 z-0 rounded-2xl" aria-label={t(`${shelter.careNm || '보호소'} 상세 정보`, `${shelter.careNm || 'Shelter'} details`)} />}
              <div className="flex min-w-0 items-center justify-between gap-3">
                <h2 className="min-w-0 truncate text-sm font-bold text-[#332d2a]">{shelter.careNm || t('보호소명 미확인', 'Unknown shelter')}</h2>
                <span className="inline-flex shrink-0 items-center rounded-full bg-primary-soft px-2 py-1 text-[11px] font-bold text-primary1">
                  {t(
                    `보호중 ${shelter.protectedAnimalCount ?? 0}마리`,
                    `${shelter.protectedAnimalCount ?? 0} in care`,
                  )}
                </span>
              </div>
              {address && <p className="mt-3 flex min-w-0 items-start gap-1.5 text-xs leading-5 text-[#817873]"><MdLocationOn className="mt-0.5 h-4 w-4 shrink-0 text-primary1" /><span>{address}</span></p>}
              {address && <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-4 text-xs font-semibold"><a href={`https://map.naver.com/p/search/${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#03c75a]/40 px-3 py-2 text-[#03a84d] hover:bg-[#03c75a]/5">{t('네이버 지도', 'Naver Maps')}</a><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#4285f4]/40 px-3 py-2 text-[#3574d4] hover:bg-[#4285f4]/5">{t('구글 지도', 'Google Maps')}</a></div>}
            </article>
          );
        })}
      </div>
      {!loading && error && <p className="py-14 text-center text-sm text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="py-14 text-center text-sm text-[#817873]">{appliedQuery ? t('검색된 보호소가 없습니다.', 'No shelters found.') : t('등록된 보호소가 없습니다.', 'No shelters available.')}</p>}
      {!loading && !error && totalPages > 1 && <nav className="mt-7 flex items-center justify-center gap-3" aria-label={t('보호소 페이지', 'Shelter pages')}><button type="button" disabled={page <= 1} onClick={() => void load(page - 1, appliedQuery, region, district, protectedStatus)} className="rounded-xl border border-[#eadfd7] p-2 text-[#817873] hover:bg-primary-soft disabled:opacity-35" aria-label={t('이전 페이지', 'Previous page')}><MdChevronLeft className="h-5 w-5" /></button><span className="text-sm font-semibold text-[#817873]">{page} / {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => void load(page + 1, appliedQuery, region, district, protectedStatus)} className="rounded-xl border border-[#eadfd7] p-2 text-[#817873] hover:bg-primary-soft disabled:opacity-35" aria-label={t('다음 페이지', 'Next page')}><MdChevronRight className="h-5 w-5" /></button></nav>}
    </section>
  );
}
