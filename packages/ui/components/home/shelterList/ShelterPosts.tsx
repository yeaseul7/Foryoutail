'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import MapComponent from './MapComponent';
import { Address, ShelterInfoItem } from '@/packages/type/shelterTyps';
import Image from 'next/image';
import { sidoLocation } from '@/static/data/sidoLocation';
import { IoCall, IoLocationSharp } from 'react-icons/io5';
import { HiOutlineStar, HiStar } from 'react-icons/hi2';
import Link from 'next/link';
import ShelterCardSkeleton from '../../base/ShelterCardSkeleton';
import { useAuth } from '@/lib/firebase/auth';
import { firestore } from '@/lib/firebase/firebase';
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';
import { fetchShelterInfoItems } from '@/lib/api/shelterInfo';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function shelterDistanceKm(
    shelter: ShelterInfoItem,
    userLat?: number,
    userLng?: number,
): number | null {
    if (
        userLat == null ||
        userLng == null ||
        shelter.lat == null ||
        shelter.lng == null ||
        !Number.isFinite(userLat) ||
        !Number.isFinite(userLng) ||
        !Number.isFinite(shelter.lat) ||
        !Number.isFinite(shelter.lng)
    ) {
        return null;
    }
    return haversineKm(userLat, userLng, shelter.lat, shelter.lng);
}

/** 보호소명·연락처 기준 중복 제거 (전화번호는 공백·하이픈·괄호 무시, 이름은 대소문자 무시) */
function dedupeSheltersByNameAndPhone(items: ShelterInfoItem[]): ShelterInfoItem[] {
    const seen = new Set<string>();
    const result: ShelterInfoItem[] = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const name = (item.careNm ?? '').trim().toLowerCase();
        const tel = (item.careTel ?? '').trim().replace(/[\s\-().]/g, '');
        const key =
            name === '' && tel === ''
                ? `__empty:${(item.careRegNo ?? '').trim() || `row-${i}`}`
                : `${name}|${tel}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(item);
    }
    return result;
}

type ShelterSortMode = 'distance' | 'name';

export default function ShelterPosts() {
    const { user } = useAuth();
    const [address, setAddress] = useState<Address | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shelters, setShelters] = useState<ShelterInfoItem[]>([]);
    const [sheltersLoading, setSheltersLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSido, setSelectedSido] = useState<string>('서울');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [sortMode, setSortMode] = useState<ShelterSortMode>('distance');
    const [favoriteShelterIds, setFavoriteShelterIds] = useState<Set<string>>(new Set());
    const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.uid) {
            setFavoriteShelterIds(new Set());
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const snap = await getDocs(collection(firestore, 'users', user.uid, 'Favorites'));
                if (cancelled) return;
                const ids = new Set<string>();
                snap.forEach((d) => ids.add(d.id));
                setFavoriteShelterIds(ids);
            } catch (e) {
                console.error('보호소 즐겨찾기 목록 로드 실패:', e);
                if (!cancelled) setFavoriteShelterIds(new Set());
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user?.uid]);

    const toggleShelterFavorite = useCallback(
        async (e: React.MouseEvent, shelter: ShelterInfoItem) => {
            e.preventDefault();
            e.stopPropagation();
            if (!user) {
                alert('즐겨찾기는 로그인 후 이용할 수 있습니다.');
                return;
            }
            const shelterId = (shelter.careRegNo ?? '').trim();
            if (!shelterId) {
                alert('보호소 관리번호가 없어 즐겨찾기할 수 없습니다.');
                return;
            }
            const ref = doc(firestore, 'users', user.uid, 'Favorites', shelterId);
            setFavoriteBusyId(shelterId);
            try {
                if (favoriteShelterIds.has(shelterId)) {
                    await deleteDoc(ref);
                    setFavoriteShelterIds((prev) => {
                        const next = new Set(prev);
                        next.delete(shelterId);
                        return next;
                    });
                } else {
                    await setDoc(ref, {
                        shelterId,
                        careNm: shelter.careNm ?? null,
                        createdAt: serverTimestamp(),
                    });
                    setFavoriteShelterIds((prev) => new Set(prev).add(shelterId));
                }
            } catch (err) {
                console.error('즐겨찾기 처리 실패:', err);
                alert('즐겨찾기 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.');
            } finally {
                setFavoriteBusyId(null);
            }
        },
        [user, favoriteShelterIds],
    );

    const fetchShelterInfo = useCallback(async (sidoCd?: string) => {
        setSheltersLoading(true);
        try {
            let targetSidoCd: string | null = null;

            if (sidoCd === undefined) {
                const storedMatchedAddress = localStorage.getItem('matched_address');
                if (storedMatchedAddress) {
                    const matchedAddress = JSON.parse(storedMatchedAddress);
                    targetSidoCd = matchedAddress.sidoCd;
                }
            } else if (sidoCd !== '') {
                targetSidoCd = sidoCd;
            }

            if (targetSidoCd === null && sidoCd === undefined) {
                const seoulSido = sidoLocation.items.find(item => item.SIDO_NAME === '서울특별시');
                targetSidoCd = seoulSido?.SIDO_CD || '6110000';
                console.log('시도 코드가 없어 기본값(서울)을 사용합니다:', targetSidoCd);
            }

            const raw = await fetchShelterInfoItems({
                upr_cd: targetSidoCd || '',
                numOfRows: 1000,
                pageNo: 1,
            });
            const items = dedupeSheltersByNameAndPhone(raw as ShelterInfoItem[]);
            setShelters(items);
            console.log(
                '보호소 정보 가져오기 성공:',
                items.length,
                '개 (중복 제거 전',
                raw.length,
                '개)',
            );
        } catch (err) {
            console.error('보호소 정보 조회 오류:', err);
            setShelters([]);
        } finally {
            setSheltersLoading(false);
        }
    }, []);

    useEffect(() => {
        const loadStoredAddress = () => {
            try {
                const storedMatchedAddress = localStorage.getItem('matched_address');
                const storedLocation = localStorage.getItem('location');

                let locationData: { latitude?: number; longitude?: number } | null = null;
                if (storedLocation) {
                    locationData = JSON.parse(storedLocation);
                }

                const DEFAULT_SEOUL_LATITUDE = 37.5665;
                const DEFAULT_SEOUL_LONGITUDE = 126.9780;

                if (storedMatchedAddress) {
                    const matchedAddress = JSON.parse(storedMatchedAddress);

                    setAddress({
                        roadAddress: '',
                        jibunAddress: '',
                        level1: matchedAddress.level1,
                        level2: '',
                        level3: '',
                        sidoCd: matchedAddress.sidoCd,
                        sidoName: matchedAddress.sidoName,
                        latitude: locationData?.latitude ?? DEFAULT_SEOUL_LATITUDE,
                        longitude: locationData?.longitude ?? DEFAULT_SEOUL_LONGITUDE,
                    });
                    // 현재 바인딩된 지역으로 초기 선택 설정
                    if (matchedAddress.sidoName) {
                        const shortName = getShortSidoName(matchedAddress.sidoName);
                        setSelectedSido(shortName);
                    }
                } else {
                    // 저장된 주소가 없으면 서울을 기본값으로 설정
                    const seoulSido = sidoLocation.items.find(item => item.SIDO_NAME === '서울특별시');
                    if (seoulSido) {
                        setAddress({
                            roadAddress: '',
                            jibunAddress: '',
                            level1: '서울특별시',
                            level2: '',
                            level3: '',
                            sidoCd: seoulSido.SIDO_CD,
                            sidoName: seoulSido.SIDO_NAME,
                            latitude: locationData?.latitude ?? DEFAULT_SEOUL_LATITUDE,
                            longitude: locationData?.longitude ?? DEFAULT_SEOUL_LONGITUDE,
                        });
                        setSelectedSido('서울');
                    }
                }

                fetchShelterInfo();

                setLoading(false);
            } catch (err) {
                console.error('저장된 주소 정보 로드 오류:', err);
                setError('주소 정보를 불러오는 중 오류가 발생했습니다.');
                setLoading(false);
            }
        };

        loadStoredAddress();
    }, [fetchShelterInfo]);

    // 시도 선택 핸들러
    const handleSidoSelect = (sidoName: string) => {
        setSelectedSido(sidoName);
        setCurrentPage(1);

        if (sidoName === '전체') {
            fetchShelterInfo('');
        } else {
            const sidoItem = sidoLocation.items.find(item => {
                const shortName = getShortSidoName(item.SIDO_NAME);
                return shortName === sidoName;
            });
            if (sidoItem) {
                fetchShelterInfo(sidoItem.SIDO_CD);
            }
        }
    };

    const getShortSidoName = (sidoName: string): string => {
        const shortNames: Record<string, string> = {
            '서울특별시': '서울',
            '부산광역시': '부산',
            '대구광역시': '대구',
            '인천광역시': '인천',
            '광주광역시': '광주',
            '대전광역시': '대전',
            '울산광역시': '울산',
            '세종특별자치시': '세종',
            '경기도': '경기',
            '강원특별자치도': '강원',
            '충청북도': '충북',
            '충청남도': '충남',
            '전북특별자치도': '전북',
            '전라남도': '전남',
            '경상북도': '경북',
            '경상남도': '경남',
            '제주특별자치도': '제주',
        };
        return shortNames[sidoName] || sidoName.replace(/특별시|광역시|특별자치시|도/g, '').replace(/특별자치도/g, '');
    };

    const filteredShelters = useMemo(() => {
        return shelters.filter(shelter => {
            const matchesSearch = searchQuery === '' ||
                (shelter.careNm?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    shelter.careAddr?.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesSearch;
        });
    }, [shelters, searchQuery]);

    const sortedShelters = useMemo(() => {
        const arr = [...filteredShelters];
        const uLat = address?.latitude;
        const uLng = address?.longitude;
        const canDistance =
            typeof uLat === 'number' &&
            typeof uLng === 'number' &&
            Number.isFinite(uLat) &&
            Number.isFinite(uLng);

        if (sortMode === 'name') {
            arr.sort((a, b) => (a.careNm || '').localeCompare(b.careNm || '', 'ko'));
            return arr;
        }

        if (sortMode === 'distance' && canDistance) {
            arr.sort((a, b) => {
                const da = shelterDistanceKm(a, uLat, uLng);
                const db = shelterDistanceKm(b, uLat, uLng);
                if (da == null && db == null) {
                    return (a.careNm || '').localeCompare(b.careNm || '', 'ko');
                }
                if (da == null) return 1;
                if (db == null) return -1;
                return da - db;
            });
            return arr;
        }

        return arr;
    }, [filteredShelters, sortMode, address?.latitude, address?.longitude]);

    useEffect(() => {
        setCurrentPage(1);
    }, [sortMode]);

    const totalPages = Math.ceil(sortedShelters.length / itemsPerPage);
    const paginatedShelters = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedShelters.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedShelters, currentPage]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">현재 위치를 가져오는 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <h3 className="text-red-800 font-semibold mb-2">위치 정보 오류</h3>
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            <div className="mb-4">
                <h1 className="text-2xl font-bold mb-2">전국 유기동물 보호소 안내</h1>
                <p className="text-sm text-gray-600">도움의 손길을 기다리는 친구들이 있는 가장 가까운 보호소를 찾아보세요.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="min-w-0 w-full">
                    <div className="border border-gray-200 rounded-3xl p-4 bg-white" style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)' }}>
                        <MapComponent
                            center={
                                address && address.latitude !== undefined && address.longitude !== undefined
                                    ? { lat: address.latitude, lng: address.longitude }
                                    : undefined
                            }
                            zoom={10}
                            shelters={shelters}
                            initialSidoCd={address?.sidoCd}
                            selectedSidoCd={
                                selectedSido === '전체'
                                    ? ''
                                    : (() => {
                                        const sidoItem = sidoLocation.items.find(item => {
                                            const shortName = getShortSidoName(item.SIDO_NAME);
                                            return shortName === selectedSido;
                                        });
                                        return sidoItem?.SIDO_CD || null;
                                    })()
                            }
                            onSidoSelect={(sidoCd) => {
                                if (sidoCd === '') {
                                    handleSidoSelect('전체');
                                } else {
                                    const sidoItem = sidoLocation.items.find(item => item.SIDO_CD === sidoCd);
                                    if (sidoItem) {
                                        handleSidoSelect(getShortSidoName(sidoItem.SIDO_NAME));
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="min-w-0 w-full">
                    <div
                        className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white"
                        style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)' }}
                    >
                        <div className="border-b border-gray-100 px-4 pb-4 pt-4">
                            <div className="relative w-full">
                                <div className="flex h-12 w-full items-center rounded-full border border-gray-200 bg-gray-50 px-4 transition-all focus-within:border-primary1/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary1/15">
                                    <Image
                                        src="/static/svg/icon-search-3.svg"
                                        alt=""
                                        width={20}
                                        height={20}
                                        className="mr-3 shrink-0 text-gray-400"
                                    />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="보호소 이름을 검색해 보세요..."
                                        className="w-full flex-1 border-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleSidoSelect('전체')}
                                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 ${selectedSido === '전체'
                                        ? 'border-primary1 bg-primary1 text-white'
                                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                                        }`}
                                >
                                    전체
                                </button>
                                {sidoLocation.items.map((sido) => {
                                    const shortName = getShortSidoName(sido.SIDO_NAME);
                                    return (
                                        <button
                                            type="button"
                                            key={sido.SIDO_CD}
                                            onClick={() => handleSidoSelect(shortName)}
                                            className={`rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 ${selectedSido === shortName
                                                ? 'border-primary1 bg-primary1 text-white'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                                                }`}
                                        >
                                            {shortName}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {sheltersLoading ? (
                            <div className="border-b border-gray-100 px-4 py-2.5 text-xs text-gray-500">
                                목록 불러오는 중…
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                                <p className="text-sm text-gray-700">
                                    <span className="font-semibold text-gray-900">
                                        {selectedSido === '전체' ? '전국' : `${selectedSido} 지역`}
                                    </span>
                                    {' 보호소 '}
                                    <span className="font-semibold tabular-nums text-gray-900">
                                        {sortedShelters.length.toLocaleString('ko-KR')}
                                    </span>
                                    곳
                                    <span className="text-gray-400"> · </span>
                                    <span className="text-gray-500">
                                        {sortMode === 'distance' ? '가까운 순' : '이름 순'}
                                    </span>
                                </p>
                                <label className="sr-only" htmlFor="shelter-sort">
                                    정렬
                                </label>
                                <select
                                    id="shelter-sort"
                                    value={sortMode}
                                    onChange={(e) => setSortMode(e.target.value as ShelterSortMode)}
                                    className="cursor-pointer rounded-lg border border-gray-200 bg-white py-1.5 pl-2 pr-8 text-xs font-medium text-gray-700 shadow-sm outline-none transition-colors hover:border-gray-300 focus:border-primary1 focus:ring-1 focus:ring-primary1/30"
                                >
                                    <option value="distance">가까운 순</option>
                                    <option value="name">이름 순</option>
                                </select>
                            </div>
                        )}

                        <div className="p-4">
                            {sheltersLoading ? (
                                <ul className="flex flex-col gap-3" role="list">
                                    {Array.from({ length: 8 }).map((_, index) => (
                                        <li key={`skeleton-${index}`}>
                                            <ShelterCardSkeleton />
                                        </li>
                                    ))}
                                </ul>
                            ) : paginatedShelters.length > 0 ? (
                                <ul className="flex flex-col gap-3" role="list">
                                    {paginatedShelters.map((shelter, index) => {
                                        const dist =
                                            address?.latitude != null &&
                                                address?.longitude != null
                                                ? shelterDistanceKm(
                                                    shelter,
                                                    address.latitude,
                                                    address.longitude,
                                                )
                                                : null;
                                        const regNo = (shelter.careRegNo ?? '').trim();
                                        const isFav = regNo !== '' && favoriteShelterIds.has(regNo);
                                        const favDisabled =
                                            !user || !regNo || favoriteBusyId === regNo;
                                        return (
                                            <li
                                                key={shelter.careRegNo || index}
                                                className="rounded-xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-gray-900">
                                                        {shelter.careNm || '보호소'}
                                                    </h3>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        {dist != null ? (
                                                            <span className="whitespace-nowrap text-xs tabular-nums text-gray-400">
                                                                {dist < 1
                                                                    ? `${Math.round(dist * 1000)}m`
                                                                    : `${dist.toFixed(1)}km`}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-300">—</span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            disabled={favDisabled}
                                                            title={
                                                                !user
                                                                    ? '로그인 후 즐겨찾기할 수 있어요'
                                                                    : !regNo
                                                                        ? '즐겨찾기를 지원하지 않는 항목이에요'
                                                                        : isFav
                                                                            ? '즐겨찾기 해제'
                                                                            : '즐겨찾기에 추가'
                                                            }
                                                            aria-label={
                                                                !user
                                                                    ? '즐겨찾기는 로그인 후 이용 가능'
                                                                    : isFav
                                                                        ? '즐겨찾기 해제'
                                                                        : '즐겨찾기에 추가'
                                                            }
                                                            aria-pressed={user ? isFav : undefined}
                                                            onClick={(e) => void toggleShelterFavorite(e, shelter)}
                                                            className={`rounded-full p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 disabled:opacity-50 ${!user || !regNo
                                                                ? 'cursor-not-allowed text-gray-300 opacity-60'
                                                                : isFav
                                                                    ? 'text-amber-500 hover:bg-amber-50'
                                                                    : 'text-gray-400 hover:bg-gray-100 hover:text-amber-500'
                                                                }`}
                                                        >
                                                            {isFav && user && regNo ? (
                                                                <HiStar className="h-5 w-5" aria-hidden />
                                                            ) : (
                                                                <HiOutlineStar
                                                                    className={`h-5 w-5 ${user && regNo ? 'text-gray-400' : ''}`}
                                                                    strokeWidth={2}
                                                                    aria-hidden
                                                                />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1 space-y-1">
                                                        {shelter.careAddr && (
                                                            <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
                                                                <IoLocationSharp className="mt-0.5 shrink-0 text-gray-400" aria-hidden />
                                                                <span>{shelter.careAddr}</span>
                                                            </p>
                                                        )}
                                                        {shelter.careTel && (
                                                            <p className="flex items-center gap-2 text-xs text-gray-500">
                                                                <IoCall className="shrink-0 text-gray-400" aria-hidden />
                                                                <span>{shelter.careTel}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="shrink-0 self-center">
                                                        {regNo ? (
                                                            <Link
                                                                href={`/animalShelter/${regNo}`}
                                                                className="inline-flex items-center justify-center rounded-full bg-primary2 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary1 hover:shadow active:scale-[0.98]"
                                                            >
                                                                상세보기
                                                            </Link>
                                                        ) : (
                                                            <span className="inline-flex cursor-not-allowed items-center justify-center rounded-full bg-gray-100 px-4 py-2 text-xs font-bold text-gray-400">
                                                                상세보기
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="py-14 text-center text-sm text-gray-500">
                                    검색 결과가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    &lt;
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-4 py-2 rounded-lg border transition-colors ${currentPage === page
                                            ? 'bg-primary1 text-white border-primary1'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    &gt;
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}