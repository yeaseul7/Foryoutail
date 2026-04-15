'use client';

import {
    collection,
    doc,
    getCountFromServer,
    getDoc,
    setDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';
import { firestore } from '@/lib/firebase/firebase';
import { hashIpForViewId, VIEW_SUBCOLLECTION, VIEW_COUNT_DELAY_MS } from '@/lib/viewCount';

export type UseViewCountOptions = {
    /** 조회 기록 전 대기 시간(ms). 기본 5000 */
    delayMs?: number;
    /** true일 때만 조회수 로드·기록. (예: 문서 로드 완료 후) */
    enabled?: boolean;
};

/**
 * 특정 문서의 조회수 로드 + IP 기준 1회 조회 기록.
 * Firestore 경로: {collectionName}/{documentId}/view/{viewerId}
 * @param collectionName 상위 컬렉션 (예: 'notice')
 * @param documentId 문서 id (없으면 동작 안 함)
 * @returns viewCount, setViewCount
 */
export function useViewCount(
    collectionName: string,
    documentId: string | undefined,
    options: UseViewCountOptions = {}
): { viewCount: number; setViewCount: React.Dispatch<React.SetStateAction<number>> } {
    const { delayMs = VIEW_COUNT_DELAY_MS, enabled = true } = options;
    const [viewCount, setViewCount] = useState(0);
    const recordedRef = useRef<string | null>(null);

    const shouldRun = Boolean(collectionName && documentId && enabled);

    // 조회수 로드
    useEffect(() => {
        if (!shouldRun) return;
        let cancelled = false;
        const viewCol = collection(
            firestore,
            collectionName,
            documentId!,
            VIEW_SUBCOLLECTION
        );
        getCountFromServer(viewCol)
            .then((snap) => {
                if (!cancelled) setViewCount(snap.data().count);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [collectionName, documentId, shouldRun]);

    // 조회 기록 (delayMs 후, IP 기준 1회만)
    useEffect(() => {
        if (!shouldRun || recordedRef.current === documentId) return;
        const timer = setTimeout(async () => {
            try {
                const res = await fetch('/api/client-ip');
                const { ip } = (await res.json()) as { ip: string };
                const viewerId = await hashIpForViewId(ip || 'unknown');

                const viewRef = doc(
                    firestore,
                    collectionName,
                    documentId!,
                    VIEW_SUBCOLLECTION,
                    viewerId
                );
                const viewSnap = await getDoc(viewRef);
                if (viewSnap.exists()) {
                    recordedRef.current = documentId!;
                    return;
                }

                await setDoc(viewRef, {
                    ip,
                    createdAt: serverTimestamp(),
                });
                recordedRef.current = documentId!;
                setViewCount((prev) => prev + 1);
            } catch (e) {
                console.error('조회 기록 실패:', e);
            }
        }, delayMs);
        return () => clearTimeout(timer);
    }, [collectionName, documentId, delayMs, shouldRun]);

    return { viewCount, setViewCount };
}
