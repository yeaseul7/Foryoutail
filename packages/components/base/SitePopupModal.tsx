'use client';

import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { useClickOutsideModal } from '@/packages/utils/clickEvent';

const POPUP_STORAGE_KEY = 'site-popup-hidden-until';
const HIDE_DURATION_MS = 4 * 60 * 60 * 1000;
const PARTNERSHIP_FORM_URL = 'https://forms.gle/ML1QntS63YAENWFu7';

function shouldShowPopup(): boolean {
  if (typeof window === 'undefined') return false;

  const rawValue = window.localStorage.getItem(POPUP_STORAGE_KEY);
  if (!rawValue) return true;

  const hiddenUntil = Number(rawValue);
  if (!Number.isFinite(hiddenUntil)) return true;

  return Date.now() >= hiddenUntil;
}

export default function SitePopupModal() {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(() => shouldShowPopup());

  const closePopup = useCallback(() => {
    setIsOpen(false);
  }, []);

  const hideForFourHours = useCallback(() => {
    window.localStorage.setItem(
      POPUP_STORAGE_KEY,
      String(Date.now() + HIDE_DURATION_MS),
    );
    setIsOpen(false);
  }, []);

  useClickOutsideModal(modalRef, closePopup, isOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-3 py-4 sm:px-5 sm:py-5">
      <div className="absolute inset-0 bg-[rgba(15,23,42,0.52)] backdrop-blur-[2px]" aria-hidden />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-popup-title"
        className="relative z-[10001] w-full max-w-[36rem] overflow-hidden rounded-[1.6rem] border border-[#e8dcc7] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.28)]"
      >
        <button
          type="button"
          onClick={closePopup}
          aria-label="팝업 닫기"
          className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#6f6f6f] text-white shadow-sm transition hover:bg-[#5f5f5f]"
        >
          <IoClose className="h-5 w-5" />
        </button>

        <a
          href={PARTNERSHIP_FORM_URL}
          target="_blank"
          rel="noreferrer"
          className="relative block w-full bg-[#f6efe4] transition hover:brightness-[1.01]"
          aria-label="제휴 참여 폼 열기"
        >
          <Image
            src="/static/images/popup/withPopup.png"
            alt="제휴 참여 안내"
            priority
            width={1200}
            height={1500}
            className="h-auto w-full object-cover"
            sizes="(max-width: 640px) 92vw, 448px"
          />
        </a>

        <h2 id="site-popup-title" className="sr-only">
          제휴 참여 안내
        </h2>

        <div className="border-t border-[#e7e1d7] bg-[#fbfaf7] px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={hideForFourHours}
              className="inline-flex min-h-[3rem] items-center justify-center rounded-[0.95rem] border border-[#e7e1d7] bg-white px-3 py-3 text-sm font-medium text-[#4b5563] transition hover:bg-[#f6f2eb]"
            >
              다시 안 보기 4시간
            </button>
            <button
              type="button"
              onClick={closePopup}
              className="inline-flex min-h-[3rem] items-center justify-center rounded-[0.95rem] border border-[#e7e1d7] bg-white px-3 py-3 text-sm font-medium text-[#4b5563] transition hover:bg-[#f6f2eb]"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
