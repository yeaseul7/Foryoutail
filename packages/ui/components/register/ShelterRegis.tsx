'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ShelterInfoItem, ShelterOption } from '@/packages/type/shelterTyps';
import { sidoLocation } from '@/static/data/sidoLocation';
import { fetchShelterInfoItems } from '@/lib/api/shelterInfo';

export type { ShelterOption };

interface ShelterRegisProps {
    value?: ShelterOption | null;
    onChange?: (value: ShelterOption | null) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export default function ShelterRegis({
    value = null,
    onChange,
    placeholder = '보호소 이름을 입력해 검색하세요',
    disabled = false,
    className = '',
}: ShelterRegisProps) {
    const [selectedSidoCd, setSelectedSidoCd] = useState<string>(() => {
        const seoul = sidoLocation.items.find((i) => i.SIDO_NAME === '서울특별시');
        return seoul?.SIDO_CD ?? sidoLocation.items[0]?.SIDO_CD ?? '';
    });
    const [inputText, setInputText] = useState('');
    const [shelters, setShelters] = useState<ShelterInfoItem[]>([]);
    const [sheltersLoading, setSheltersLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedShelter: ShelterOption | null = value ?? null;
    const filteredShelters = shelters.filter((s) => {
        const name = (s.careNm ?? '').trim();
        const query = inputText.trim().toLowerCase();
        if (!query) return true;
        return name.toLowerCase().includes(query);
    });

    const fetchShelters = useCallback(async (sidoCd: string) => {
        if (!sidoCd) {
            setShelters([]);
            return;
        }
        setSheltersLoading(true);
        try {
            const list = await fetchShelterInfoItems({
                upr_cd: sidoCd,
                numOfRows: 1000,
                pageNo: 1,
            });
            setShelters(list);
        } catch (e) {
            console.error('보호소 목록 조회 오류:', e);
            setShelters([]);
        } finally {
            setSheltersLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShelters(selectedSidoCd);
    }, [selectedSidoCd, fetchShelters]);

    useEffect(() => {
        if (!showDropdown) setHighlightIndex(-1);
    }, [showDropdown]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setInputText(v);
        setShowDropdown(true);
        if (selectedShelter && onChange) onChange(null);
    };

    const handleInputFocus = () => {
        setShowDropdown(true);
    };

    const handleSelect = (shelter: ShelterInfoItem) => {
        const name = (shelter.careNm ?? '').trim();
        const regNo = (shelter.careRegNo ?? '').trim();
        if (!name || !regNo) return;
        setInputText(name);
        setShowDropdown(false);
        onChange?.({
            careNm: name,
            careRegNo: regNo,
            careAddr: (shelter.careAddr ?? '').trim() || undefined,
            jibunAddr: (shelter.jibunAddr ?? '').trim() || undefined,
            uprCd: selectedSidoCd || undefined,
            orgCd: (shelter.orgCd ?? (shelter as { org_cd?: string }).org_cd ?? '').toString().trim() || undefined,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || filteredShelters.length === 0) {
            if (e.key === 'Escape') setShowDropdown(false);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex((i) => (i < filteredShelters.length - 1 ? i + 1 : i));
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex((i) => (i > 0 ? i - 1 : 0));
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            const item = filteredShelters[highlightIndex >= 0 ? highlightIndex : 0];
            if (item) handleSelect(item);
            return;
        }
        if (e.key === 'Escape') {
            setShowDropdown(false);
            setHighlightIndex(-1);
        }
    };

    const displayValue = selectedShelter ? selectedShelter.careNm : inputText;

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <label className="shrink-0 text-sm font-medium text-text2">지역</label>
                <select
                    value={selectedSidoCd}
                    onChange={(e) => setSelectedSidoCd(e.target.value)}
                    disabled={disabled}
                    className="w-full sm:w-36 px-3 py-2 text-sm border border-border3 rounded-md bg-element1 text-text1 focus:outline-none focus:ring-2 focus:ring-primary1/30 focus:border-primary1 disabled:opacity-60"
                    aria-label="시도 선택"
                >
                    {sidoLocation.items.map((item) => (
                        <option key={item.SIDO_CD} value={item.SIDO_CD}>
                            {item.SIDO_NAME}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-3">
                <label className="block mb-1 text-sm font-medium text-text2">보호소</label>
                <div className="relative">
                    <input
                        type="text"
                        value={displayValue}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        autoComplete="off"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={showDropdown}
                        aria-controls="shelter-listbox"
                        aria-activedescendant={highlightIndex >= 0 ? `shelter-option-${highlightIndex}` : undefined}
                        id="shelter-search"
                        className="w-full px-3 py-2 text-base text-text1 bg-element1 border border-border3 rounded-md placeholder:text-text3 focus:outline-none focus:ring-2 focus:ring-primary1/30 focus:border-primary1 disabled:opacity-60"
                    />
                    {sheltersLoading && (
                        <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-text3">조회 중...</span>
                    )}

                    {showDropdown && (
                        <ul
                            id="shelter-listbox"
                            role="listbox"
                            className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md border border-border3 bg-element1 py-1 shadow-lg"
                        >
                            {filteredShelters.length === 0 ? (
                                <li className="px-3 py-2 text-sm text-text3">
                                    {sheltersLoading ? '목록 조회 중...' : '검색 결과가 없습니다.'}
                                </li>
                            ) : (
                                filteredShelters.slice(0, 50).map((shelter, idx) => {
                                    const name = (shelter.careNm ?? '').trim();
                                    const regNo = (shelter.careRegNo ?? '').trim();
                                    const isHighlight = idx === highlightIndex;
                                    return (
                                        <li
                                            key={shelter.careRegNo ?? idx}
                                            id={`shelter-option-${idx}`}
                                            role="option"
                                            aria-selected={isHighlight}
                                            onMouseEnter={() => setHighlightIndex(idx)}
                                            onClick={() => handleSelect(shelter)}
                                            className={`cursor-pointer px-3 py-2 text-sm text-text1 hover:bg-primary1/10 ${isHighlight ? 'bg-primary1/10' : ''}`}
                                        >
                                            <span className="font-medium">{name}</span>
                                            {regNo && <span className="ml-2 text-text3">({regNo})</span>}
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    )}
                </div>

                {selectedShelter && (
                    <div className="mt-1.5 space-y-0.5 text-xs text-text3" aria-live="polite">
                        <p>보호소 관리번호: <span className="font-mono text-text2">{selectedShelter.careRegNo}</span></p>
                        {selectedShelter.careAddr && (
                            <p>위치: <span className="text-text2">{selectedShelter.careAddr}</span></p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
