'use client';

import {
  dismissBoardWriteGuideline,
  getBoardWriteGuidelineDismissedServerSnapshot,
  getBoardWriteGuidelineDismissedSnapshot,
  subscribeBoardWriteGuidelineDismissed,
} from '@/lib/community/boardWriteGuidelineStorage';
import { useSyncExternalStore } from 'react';
import { HiLightBulb, HiXMark } from 'react-icons/hi2';

export default function WriteNotice() {
  const dismissed = useSyncExternalStore(
    subscribeBoardWriteGuidelineDismissed,
    getBoardWriteGuidelineDismissedSnapshot,
    getBoardWriteGuidelineDismissedServerSnapshot,
  );

  const handleDismiss = () => {
    dismissBoardWriteGuideline();
  };

  if (dismissed) {
    return null;
  }

  return (
    <div className="relative flex flex-col gap-4 rounded-xl border border-blue-200 bg-blue-50 p-6 pr-12">
      <button
        type="button"
        aria-label="작성 가이드라인 닫기"
        onClick={handleDismiss}
        className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-blue-100/80 hover:text-gray-800"
      >
        <HiXMark className="h-5 w-5" aria-hidden />
      </button>

      <div className="flex items-center gap-2">
        <HiLightBulb className="h-5 w-5 shrink-0 text-primary1" />
        <h3 className="text-lg font-bold text-gray-900">작성 가이드라인</h3>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <span className="shrink-0 text-sm font-bold text-primary1">01.</span>
          <p className="text-sm text-gray-700">
            사진과 함께 남겨주시면 아이의 이야기가 더 잘 전해져요.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="shrink-0 text-sm font-bold text-primary1">02.</span>
          <p className="text-sm text-gray-700">
            나이, 성격이나 특징을 적어주시면 다른 분들께 도움이 돼요.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="shrink-0 text-sm font-bold text-primary1">03.</span>
          <p className="text-sm text-gray-700">
            서로 존중하는 마음으로 편하게 이야기 나눠주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
