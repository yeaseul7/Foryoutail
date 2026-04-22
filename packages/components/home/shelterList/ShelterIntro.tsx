'use client';

import { IoInformationCircle } from 'react-icons/io5';
import { HiPencil } from 'react-icons/hi';
import { HiDocumentText } from 'react-icons/hi';
import { HiPlus } from 'react-icons/hi';
import { useAuth } from '@/lib/firebase/auth';
import { useFullAdmin } from '@/hooks/useFullAdmin';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/firebase';
import { useEffect, useState } from 'react';

interface ShelterIntroProps {
    /** 현재 보호소의 관리번호(careRegNo). URL 인코딩된 id가 아님. */
    shelterId: string;
}

interface ShelterIntroData {
    content: string;
    createdAt: Timestamp | null;
    updatedAt: Timestamp | null;
    authorId: string;
}

const EMPTY_HTML = '<p></p>';

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function textToHtml(value: string) {
    const paragraphs = value
        .trim()
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    if (paragraphs.length === 0) return EMPTY_HTML;

    return paragraphs
        .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
        .join('');
}

function htmlToText(value: string) {
    return value
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();
}

export default function ShelterIntro({ shelterId }: ShelterIntroProps) {
    const { user } = useAuth();
    const { fullAdmin: userFullAdmin } = useFullAdmin();
    const [introData, setIntroData] = useState<ShelterIntroData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [draftContent, setDraftContent] = useState('');
    /** 로그인한 사용자의 보호소 관리번호(shelterInfo.careRegNo) */
    const [userShelterCareRegNo, setUserShelterCareRegNo] = useState<string | null>(null);
    const [userProfileLoading, setUserProfileLoading] = useState(true);

    const isManagerOfThisShelter = Boolean(
        user && userShelterCareRegNo && shelterId && userShelterCareRegNo === shelterId
    );
    /** 이 보호소 관리자이거나 전체 관리자(fulladmin)일 때 수정 가능 */
    const canEditIntro = Boolean(user && (isManagerOfThisShelter || userFullAdmin));

    // 로그인한 사용자의 보호소 정보(shelterInfo.careRegNo) 로드
    useEffect(() => {
        const loadUserProfile = async () => {
            if (!user?.uid) {
                setUserShelterCareRegNo(null);
                setUserProfileLoading(false);
                return;
            }
            try {
                const userDoc = await getDoc(doc(firestore, 'users', user.uid));
                const data = userDoc.data();
                const careRegNo = data?.shelterInfo?.careRegNo;
                setUserShelterCareRegNo(careRegNo != null ? String(careRegNo) : null);
            } catch (error) {
                console.error('사용자 프로필 로드 오류:', error);
                setUserShelterCareRegNo(null);
            } finally {
                setUserProfileLoading(false);
            }
        };
        loadUserProfile();
    }, [user?.uid]);

    // 데이터 로드
    useEffect(() => {
        const loadIntroData = async () => {
            if (!shelterId) {
                setLoading(false);
                return;
            }

            try {
                const introDocRef = doc(firestore, 'shelter-info', shelterId);
                const introDoc = await getDoc(introDocRef);

                if (introDoc.exists()) {
                    const data = introDoc.data() as ShelterIntroData;
                    setIntroData(data);
                    setDraftContent(htmlToText(data.content || ''));
                } else {
                    setIntroData(null);
                    setDraftContent('');
                }
            } catch (error) {
                console.error('보호소 소개 정보 로드 오류:', error);
            } finally {
                setLoading(false);
            }
        };

        loadIntroData();
    }, [shelterId]);

    const handleSave = async () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        if (!canEditIntro) {
            alert('해당 보호소 관리자만 수정 가능합니다.');
            return;
        }

        const content = textToHtml(draftContent);
        if (content === EMPTY_HTML) {
            alert('내용을 입력해주세요.');
            return;
        }

        setIsSaving(true);
        try {
            const introDocRef = doc(firestore, 'shelter-info', shelterId);
            const dataToSave = {
                content,
                updatedAt: serverTimestamp(),
                ...(introData ? {} : { createdAt: serverTimestamp(), authorId: user.uid }),
            };

            await setDoc(introDocRef, dataToSave, { merge: true });

            setIntroData({
                content,
                createdAt: introData?.createdAt ?? null,
                updatedAt: introData?.updatedAt ?? null,
                authorId: introData?.authorId || user.uid,
            });
            setIsEditing(false);
            alert('소개 정보가 저장되었습니다.');
        } catch (error) {
            console.error('소개 정보 저장 오류:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }
        if (!canEditIntro) {
            alert('해당 보호소 관리자만 수정 가능합니다.');
            return;
        }
        setDraftContent(htmlToText(introData?.content || ''));
        setIsEditing(true);
    };

    const handleCancel = () => {
        setDraftContent(htmlToText(introData?.content || ''));
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-center">
                <p className="text-gray-500">로딩 중...</p>
            </div>
        );
    }

    const hasContent = introData?.content && introData.content !== EMPTY_HTML;

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <IoInformationCircle className="w-5 h-5 text-primary1" />
                    <h2 className="text-lg font-bold text-gray-900">보호소 소개</h2>
                </div>
                {hasContent && canEditIntro && (
                    <button
                        onClick={handleEdit}
                        className="flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <HiPencil className="w-4 h-4" />
                        <span className="text-sm">정보 수정</span>
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="flex flex-col gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-700">
                            💡 이 보호소로 등록된 관리자만 등록 및 수정이 가능합니다.
                        </p>
                    </div>
                    <textarea
                        className="min-h-[200px] w-full resize-y rounded-lg border border-gray-200 p-4 text-sm outline-none transition-colors focus:border-primary1"
                        placeholder="보호소의 특별한 점이나 운영 철학 등을 작성해주세요."
                        value={draftContent}
                        onChange={(event) => setDraftContent(event.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? '저장 중...' : '저장하기'}
                        </button>
                    </div>
                </div>
            ) : hasContent ? (
                <div className="prose max-w-none text-sm">
                    <div dangerouslySetInnerHTML={{ __html: introData.content }} />
                </div>
            ) : (
                <>
                    {user && !userProfileLoading && !canEditIntro && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-xs text-amber-800">
                                ⚠️ 해당 보호소 관리자만 수정 가능합니다. 회원가입 시 이 보호소를 선택한 계정으로 로그인해주세요.
                            </p>
                        </div>
                    )}
                    {!user && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-700">
                                💡 로그인한 상태에서만 등록 및 수정이 가능합니다.
                            </p>
                        </div>
                    )}
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                        <HiDocumentText className="w-10 h-10 text-gray-300" />
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-base font-bold text-gray-900">등록된 소개 정보가 없습니다</p>
                            <p className="text-sm text-gray-500 text-center max-w-md">
                                보호소의 특별한 점이나 운영 철학 등을 작성하여 예비 입양 가족들에게 들려주세요.
                            </p>
                        </div>
                    </div>

                    {canEditIntro && (
                        <div className="flex justify-center">
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 border border-primary1 text-primary1 rounded-3xl px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-5 h-5 rounded-full bg-primary1 flex items-center justify-center">
                                    <HiPlus className="w-3 h-3 text-white" />
                                </div>
                                <span>소개 등록하기</span>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
