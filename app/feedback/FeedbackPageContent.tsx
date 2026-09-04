'use client';

import { useEffect, useState } from 'react';
import { MdClose, MdEditNote } from 'react-icons/md';
import { useLanguage } from '@/lib/i18n/language';
import FeedbackForm from './FeedbackForm';
import FeedbackList from './FeedbackList';

export default function FeedbackPageContent() {
  const { t } = useLanguage();
  const [writeOpen, setWriteOpen] = useState(false);

  useEffect(() => {
    if (!writeOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setWriteOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [writeOpen]);

  return (
    <div className="mx-auto w-full max-w-4xl py-5 sm:py-10">
      <section className="mb-5 flex items-center justify-between gap-4 px-1 sm:mb-7">
          <div>
            <h1 className="text-xl font-bold text-[#332d2a] sm:text-2xl">{t('건의함', 'Feedback')}</h1>
            <p className="mt-1 text-sm text-[#817873]">{t('서비스에 대한 의견과 문의를 확인해보세요.', 'Browse suggestions and inquiries about the service.')}</p>
          </div>
          <button type="button" onClick={() => setWriteOpen(true)} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary1 px-5 text-sm font-bold text-white transition hover:bg-primary2">
            <MdEditNote className="h-5 w-5" aria-hidden />
            {t('문의하기', 'New inquiry')}
          </button>
      </section>

      <FeedbackList />

      {writeOpen && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/35 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setWriteOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-label={t('문의 작성', 'Write an inquiry')} className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[22px] bg-[#f8f6f4] p-2 shadow-2xl sm:rounded-[22px]">
            <button type="button" onClick={() => setWriteOpen(false)} className="absolute right-4 top-4 z-10 rounded-full p-2 text-[#817873] transition hover:bg-primary-soft" aria-label={t('닫기', 'Close')}>
              <MdClose className="h-5 w-5" aria-hidden />
            </button>
            <FeedbackForm />
          </div>
        </div>
      )}
    </div>
  );
}
