'use client';

import { HiCheckCircle } from 'react-icons/hi2';

/**
 * 비동기 작업(업로드·저장 등) 중 전체 화면을 막고 진행 상태를 보여줄 때 사용합니다.
 * `variant="success"`이면 스피너 대신 완료 메시지(`title`)와 꽉 찬 진행 바를 표시합니다.
 */
export interface BlockingProgressOverlayProps {
  open: boolean;
  /** `loading`: 업로드 중 UI / `success`: 완료(진행 바 100%) */
  variant?: 'loading' | 'success';
  /** 큰 제목 — 성공 단계에서는 여기에 성공 문구를 넘기면 됩니다. */
  title?: string;
  /** 작은 보조 문구 */
  subtitle?: string;
  className?: string;
}

export default function BlockingProgressOverlay({
  open,
  variant = 'loading',
  title,
  subtitle = '잠시만 기다려 주세요.',
  className,
}: BlockingProgressOverlayProps) {
  if (!open) return null;

  const isSuccess = variant === 'success';
  const headline =
    title ?? (isSuccess ? '완료되었습니다!' : '업로드 중');
  const busy = !isSuccess;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-busy={busy}
      aria-live="polite"
      aria-labelledby="blocking-progress-title"
      aria-describedby="blocking-progress-desc"
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px] ${className ?? ''}`}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white px-6 py-8 text-center shadow-lg">
        {isSuccess ? (
          <HiCheckCircle
            className="mx-auto mb-4 h-14 w-14 text-emerald-500"
            aria-hidden
          />
        ) : (
          <div
            className="mx-auto mb-5 h-11 w-11 shrink-0 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary1"
            aria-hidden
          />
        )}
        <p id="blocking-progress-title" className="text-base font-semibold text-gray-900">
          {headline}
        </p>
        <p id="blocking-progress-desc" className="mt-1 text-sm text-gray-500">
          {subtitle}
        </p>

        <div
          className="relative mt-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-100"
          aria-hidden
        >
          {isSuccess ? (
            <div className="h-full w-full rounded-full bg-emerald-500 transition-all duration-300" />
          ) : (
            <div className="absolute inset-y-0 left-0 w-[38%] rounded-full bg-primary1 animate-overlayIndeterminate" />
          )}
        </div>
      </div>
    </div>
  );
}
