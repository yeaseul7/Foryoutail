'use client';

import { useEffect, useMemo, useState } from 'react';
import { IoInformationCircle } from 'react-icons/io5';
import { HiDocumentText, HiPencilSquare } from 'react-icons/hi2';
import { useFullAdmin } from '@/hooks/useFullAdmin';
import { getSupabaseAccessToken } from '@/lib/supabase/client';

interface ShelterIntroProps {
  shelterId: string;
  fallbackContent?: string;
}

interface ShelterDetailRecord {
  id: string;
  shelter_id: string;
  ntxt: string | null;
  created_at: string;
  updated_at: string;
}

type IntroContent =
  | { type: 'text'; value: string; detailId?: string }
  | { type: 'html'; value: string };

const EMPTY_HTML = '<p></p>';

function hasMeaningfulHtml(content?: string) {
  const trimmed = (content ?? '').trim();
  return Boolean(trimmed && trimmed !== EMPTY_HTML);
}

export default function ShelterIntro({
  shelterId,
  fallbackContent = '',
}: ShelterIntroProps) {
  const { fulladmin, loading: fullAdminLoading } = useFullAdmin();
  const [introData, setIntroData] = useState<IntroContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const fallbackHtml = useMemo(
    () => (hasMeaningfulHtml(fallbackContent) ? fallbackContent.trim() : ''),
    [fallbackContent],
  );

  useEffect(() => {
    let cancelled = false;

    const loadIntroData = async () => {
      if (!shelterId) {
        if (!cancelled) {
          setIntroData(
            fallbackHtml ? { type: 'html', value: fallbackHtml } : null,
          );
          setDraft('');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/shelter-detail?shelter_id=${encodeURIComponent(shelterId)}`,
          {
            cache: 'no-store',
            headers: { Accept: 'application/json' },
          },
        );

        if (!response.ok) {
          throw new Error('보호소 소개 조회 실패');
        }

        const body = (await response.json()) as {
          detail?: ShelterDetailRecord | null;
        };
        if (cancelled) return;

        const text = body.detail?.ntxt?.trim() ?? '';
        if (text) {
          setIntroData({
            type: 'text',
            value: text,
            detailId: body.detail?.id,
          });
          setDraft(text);
          return;
        }

        if (fallbackHtml) {
          setIntroData({ type: 'html', value: fallbackHtml });
          setDraft('');
        } else {
          setIntroData(null);
          setDraft('');
        }
      } catch (error) {
        console.error('보호소 소개 정보 로드 오류:', error);
        if (!cancelled) {
          if (fallbackHtml) {
            setIntroData({ type: 'html', value: fallbackHtml });
          } else {
            setIntroData(null);
          }
          setDraft('');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadIntroData();

    return () => {
      cancelled = true;
    };
  }, [fallbackHtml, shelterId]);

  const openEditor = () => {
    setDraft(introData?.value ?? '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!shelterId) {
      alert('보호소 ID를 확인할 수 없습니다.');
      return;
    }

    const trimmed = draft.trim();
    if (!trimmed) {
      alert('소개 내용을 입력해 주세요.');
      return;
    }

    const token = await getSupabaseAccessToken();
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/shelter-detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shelter_id: shelterId,
          ntxt: trimmed,
        }),
      });

      const body = (await response.json()) as {
        error?: string;
        detail?: ShelterDetailRecord;
      };

      if (!response.ok || !body.detail) {
        throw new Error(body.error || '보호소 소개 저장 실패');
      }

      setIntroData({
        type: 'text',
        value: body.detail.ntxt?.trim() || '',
        detailId: body.detail.id,
      });
      setDraft(body.detail.ntxt?.trim() || '');
      setIsEditing(false);
      alert('보호소 소개를 저장했습니다.');
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : '보호소 소개 저장 중 오류가 발생했습니다.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  const canEdit = fulladmin === true && !fullAdminLoading;
  const hasIntro = Boolean(introData?.value?.trim());

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IoInformationCircle className="w-5 h-5 text-primary1" />
          <h2 className="text-lg font-bold text-gray-900">보호소 소개</h2>
        </div>

        {canEdit && !isEditing && (
          <button
            type="button"
            onClick={openEditor}
            className="inline-flex items-center gap-1 rounded-full bg-primary1/10 px-3 py-1.5 text-sm font-semibold text-primary1 hover:bg-primary1/15"
          >
            <HiPencilSquare className="h-4 w-4" />
            소개 수정
          </button>
        )}
      </div>

      {isEditing && canEdit ? (
        <div className="flex flex-col gap-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            placeholder="보호소 소개를 입력해 주세요."
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-primary1/40"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setDraft(introData?.value ?? '');
              }}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${
                saving
                  ? 'cursor-not-allowed bg-primary1/50'
                  : 'bg-primary1 hover:bg-primary2'
              }`}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      ) : hasIntro ? (
        introData?.type === 'html' ? (
          <div className="prose max-w-none text-sm">
            <div dangerouslySetInnerHTML={{ __html: introData.value }} />
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
            {introData?.value}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <HiDocumentText className="w-10 h-10 text-gray-300" />
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-base font-bold text-gray-900">
              보호소 소개 정보는 아직 제공되지 않았어요.
            </p>
            <p className="text-sm text-gray-500">
              방문 전 운영 시간과 연락처를 확인해 주세요.
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={openEditor}
              className="inline-flex items-center gap-1 rounded-full bg-primary1/10 px-4 py-2 text-sm font-semibold text-primary1 hover:bg-primary1/15"
            >
              <HiPencilSquare className="h-4 w-4" />
              소개 작성
            </button>
          )}
        </div>
      )}
    </div>
  );
}
