'use client';

import { useCallback, useState } from 'react';
import { ShelterInfoItem } from '@/packages/type/shelterTyps';
import { IoCopyOutline, IoLocationSharp } from 'react-icons/io5';
import ShelterMapComponent from './ShelterMapComponent';

interface OperationInfoProps {
    shelter: ShelterInfoItem;
}

async function copyPlainText(text: string | undefined, failMessage: string): Promise<boolean> {
    const t = text?.trim();
    if (!t) return false;
    try {
        await navigator.clipboard.writeText(t);
        return true;
    } catch {
        try {
            const ta = document.createElement('textarea');
            ta.value = t;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            return true;
        } catch {
            alert(failMessage);
            return false;
        }
    }
}

const copyButtonClass =
    'inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:border-primary1/40 hover:bg-primary1/5 hover:text-primary1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary1/30';

const metaRowClass = 'flex items-start justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3';
const metaLabelClass = 'text-sm text-gray-500';
const metaValueClass = 'text-right text-sm font-semibold text-gray-900 break-keep';

function isEmptyValue(value: unknown) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
}

function formatTime(time?: string) {
    if (!time) return '';
    if (time.includes(':')) return time;
    if (time.length === 4) return `${time.slice(0, 2)}:${time.slice(2, 4)}`;
    return time;
}

function formatDate(value?: string) {
    if (!value) return null;
    const normalized = value.includes('T') ? value.slice(0, 10) : value;
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return value;
    return `${match[1]}.${match[2]}.${match[3]}`;
}

function formatValue(value: unknown) {
    if (isEmptyValue(value)) return null;
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'boolean') return value ? '예' : '아니오';
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
}

function parseCoordinate(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

export default function OperationInfo({ shelter }: OperationInfoProps) {
    const [addressCopied, setAddressCopied] = useState(false);
    const [phoneCopied, setPhoneCopied] = useState(false);

    const copyCareAddress = useCallback(async () => {
        const ok = await copyPlainText(
            shelter.careAddr,
            '주소를 복사할 수 없습니다. 브라우저 설정을 확인해 주세요.',
        );
        if (!ok) return;
        setAddressCopied(true);
        window.setTimeout(() => setAddressCopied(false), 2000);
    }, [shelter.careAddr]);

    const copyCareTel = useCallback(async () => {
        const ok = await copyPlainText(
            shelter.careTel,
            '연락처를 복사할 수 없습니다. 브라우저 설정을 확인해 주세요.',
        );
        if (!ok) return;
        setPhoneCopied(true);
        window.setTimeout(() => setPhoneCopied(false), 2000);
    }, [shelter.careTel]);

    const weekOprTime = (shelter.weekOprStime && shelter.weekOprEtime)
        ? `${formatTime(shelter.weekOprStime)} - ${formatTime(shelter.weekOprEtime)}`
        : null;

    const weekCellTime = (shelter.weekCellStime && shelter.weekCellEtime)
        ? `${formatTime(shelter.weekCellStime)} - ${formatTime(shelter.weekCellEtime)}`
        : null;

    // 주말 운영 시간
    const weekendOprTime = (shelter.weekendOprStime && shelter.weekendOprEtime)
        ? `${formatTime(shelter.weekendOprStime)} - ${formatTime(shelter.weekendOprEtime)}`
        : null;

    const weekendCellTime = (shelter.weekendCellStime && shelter.weekendCellEtime)
        ? `${formatTime(shelter.weekendCellStime)} - ${formatTime(shelter.weekendCellEtime)}`
        : null;

    const lat = parseCoordinate(shelter.lat);
    const lng = parseCoordinate(shelter.lng);

    const basicInfo = [
        { label: '연락처', value: shelter.careTel },
        { label: '관할 기관', value: shelter.orgNm },
        { label: '운영 구분', value: shelter.divisionNm },
        { label: '보호 대상', value: shelter.saveTrgtAnimal },
        { label: '휴무일', value: shelter.closeDay },
        { label: '운영 시간', value: weekOprTime },
        { label: '주말 운영', value: weekendOprTime },
        { label: '분양 시간', value: weekCellTime },
        { label: '주말 분양', value: weekendCellTime },
    ].filter((item) => !isEmptyValue(item.value));

    return (
        <div className="bg-white rounded-3xl shadow-sm p-4 lg:p-8 flex flex-col gap-5">
            {shelter.careAddr && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 text-sm text-gray-600">
                        <div className="flex min-w-0 items-center gap-2">
                            <IoLocationSharp className="h-4 w-4 shrink-0" aria-hidden />
                            <span>주소</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => void copyCareAddress()}
                            className={copyButtonClass}
                            aria-label="주소 복사"
                        >
                            <IoCopyOutline className="h-3.5 w-3.5" aria-hidden />
                            {addressCopied ? '복사됨' : '복사'}
                        </button>
                    </div>
                    <p className="font-bold text-gray-900 break-keep">{shelter.careAddr}</p>

                    {/* 지도 */}
                    {lat !== null && lng !== null && (
                        <div className="w-full h-64 rounded-3xl overflow-hidden relative">
                            <ShelterMapComponent
                                lat={lat}
                                lng={lng}
                                title={shelter.careNm}
                                address={shelter.careAddr}
                                height="256px"
                                zoom={16}
                            />
                        </div>
                    )}
                </div>
            )}

            {basicInfo.length > 0 && (
                <div>
                    {/* <div className="text-sm text-gray-600">기본 정보</div> */}
                    <div className="flex flex-col gap-3">
                        {basicInfo.map((item) => (
                            <div
                                key={item.label}
                                className="grid grid-cols-[104px_1fr] gap-4"
                            >
                                <span className={item.label === '휴무일' ? 'text-sm text-red-500' : metaLabelClass}>
                                    {item.label}
                                </span>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-semibold text-gray-900 break-keep">{item.value}</span>
                                    {item.label === '연락처' && shelter.careTel && (
                                        <button
                                            type="button"
                                            onClick={() => void copyCareTel()}
                                            className={copyButtonClass}
                                            aria-label="연락처 복사"
                                        >
                                            <IoCopyOutline className="h-3.5 w-3.5" aria-hidden />
                                            {phoneCopied ? '복사됨' : '복사'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
