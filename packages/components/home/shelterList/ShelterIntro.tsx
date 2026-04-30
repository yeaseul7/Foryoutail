'use client';

import { useEffect, useState } from 'react';
import { IoInformationCircle } from 'react-icons/io5';
import { HiDocumentText } from 'react-icons/hi';
import { fetchShelterInfoByCareRegNo } from '@/lib/client/shelter-info';

interface ShelterIntroProps {
  shelterId: string;
}

const EMPTY_HTML = '<p></p>';

interface ShelterIntroState {
  content: string;
}

export default function ShelterIntro({ shelterId }: ShelterIntroProps) {
  const [introData, setIntroData] = useState<ShelterIntroState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadIntroData = async () => {
      if (!shelterId) {
        if (!cancelled) {
          setIntroData(null);
          setLoading(false);
        }
        return;
      }

      try {
        const shelter = await fetchShelterInfoByCareRegNo(shelterId);
        if (cancelled) return;

        const content = (shelter?.content ?? '').trim();
        if (content && content !== EMPTY_HTML) {
          setIntroData({ content });
        } else {
          setIntroData(null);
        }
      } catch (error) {
        console.error('보호소 소개 정보 로드 오류:', error);
        if (!cancelled) {
          setIntroData(null);
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
  }, [shelterId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!introData?.content) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <IoInformationCircle className="w-5 h-5 text-primary1" />
          <h2 className="text-lg font-bold text-gray-900">보호소 소개</h2>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <HiDocumentText className="w-10 h-10 text-gray-300" />
          <div className="flex flex-col items-center gap-2">
            <p className="text-base font-bold text-gray-900">보호소 소개 정보는 아직 제공되지 않았어요.<br />
              방문 전 운영 시간과 연락처를 확인해 주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <IoInformationCircle className="w-5 h-5 text-primary1" />
        <h2 className="text-lg font-bold text-gray-900">보호소 소개</h2>
      </div>

      <div className="prose max-w-none text-sm">
        <div dangerouslySetInnerHTML={{ __html: introData.content }} />
      </div>
    </div>
  );
}
