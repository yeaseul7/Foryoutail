'use client';

import { FormEvent, useState } from 'react';
import { MdCheckCircle, MdSend } from 'react-icons/md';
import { useLanguage } from '@/lib/i18n/language';
import { loadSupabaseBrowserConfig, supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

export default function FeedbackForm() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [category, setCategory] = useState('suggestion');
  const [content, setContent] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || content.trim().length < 10) return;
    setSubmitting(true);
    setError('');
    try {
      let accessToken: string | undefined;
      try {
        await loadSupabaseBrowserConfig();
        const { data } = await supabase.auth.getSession();
        accessToken = data.session?.access_token;
      } catch {
        // 비로그인 건의는 Supabase 브라우저 설정 없이도 API에서 접수한다.
      }
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ category, content, contactEmail, isPublic, website }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || t('건의를 접수하지 못했습니다.', 'Could not submit feedback.'));
      setSubmitted(true);
      setContent('');
      setContactEmail('');
      window.dispatchEvent(new Event('feedback-submitted'));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('건의를 접수하지 못했습니다.', 'Could not submit feedback.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 rounded-2xl bg-white px-5 py-12 text-center shadow-sm sm:px-8">
        <MdCheckCircle className="h-10 w-10 text-primary1" aria-hidden />
        <h1 className="text-xl font-bold text-[#332d2a]">{t('건의가 접수되었습니다', 'Feedback received')}</h1>
        <p className="text-sm text-[#817873]">{t('더 나은 꼬순내를 만드는 데 참고하겠습니다.', 'We will use it to improve Kkosunnae.')}</p>
        <button type="button" onClick={() => setSubmitted(false)} className="mt-2 rounded-xl border border-primary1/30 px-4 py-2 text-sm font-semibold text-primary1 hover:bg-primary-soft">
          {t('추가로 건의하기', 'Send another')}
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-xl rounded-2xl bg-white px-4 py-6 shadow-sm sm:px-8 sm:py-8">
      <h1 className="text-xl font-bold text-[#332d2a] sm:text-2xl">{t('건의함', 'Feedback')}</h1>
      <p className="mt-2 text-sm leading-6 text-[#817873]">{t('서비스 개선 의견이나 불편한 점을 알려주세요.', 'Tell us how we can improve the service.')}</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-[#332d2a]">{t('분류', 'Category')}</legend>
          <div className="flex flex-wrap gap-2">
            {[
              ['suggestion', t('개선 제안', 'Suggestion')],
              ['bug', t('오류 제보', 'Bug report')],
              ['other', t('기타', 'Other')],
            ].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setCategory(value)} aria-pressed={category === value} className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${category === value ? 'border-primary1 bg-primary-soft text-primary1' : 'border-[#e4dcd7] text-[#817873] hover:border-primary1/50'}`}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-[#332d2a]">{t('공개 여부', 'Visibility')}</legend>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setIsPublic(true)} aria-pressed={isPublic} className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${isPublic ? 'border-primary1 bg-primary-soft text-primary1' : 'border-[#e4dcd7] text-[#817873]'}`}>
              {t('공개', 'Public')}
            </button>
            <button type="button" onClick={() => setIsPublic(false)} disabled={!user} aria-pressed={!isPublic} className={`rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${!isPublic ? 'border-primary1 bg-primary-soft text-primary1' : 'border-[#e4dcd7] text-[#817873]'}`}>
              {t('비공개', 'Private')}
            </button>
          </div>
          {!user && <p className="mt-2 text-xs text-[#9a918b]">{t('비공개 문의는 로그인 후 작성할 수 있습니다.', 'Sign in to submit a private inquiry.')}</p>}
        </fieldset>

        <label className="flex flex-col gap-2 text-sm font-semibold text-[#332d2a]">
          {t('내용', 'Message')}
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            minLength={10}
            maxLength={2000}
            required
            rows={7}
            placeholder={t('10자 이상 자세히 적어주세요.', 'Please provide at least 10 characters.')}
            className="resize-y rounded-xl border border-[#e4dcd7] bg-[#fffdfb] px-4 py-3 font-normal leading-6 outline-none transition focus:border-primary1 focus:ring-2 focus:ring-primary1/15"
          />
          <span className="text-right text-xs font-normal text-[#9a918b]">{content.length}/2000</span>
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-[#332d2a]">
          {t('답변받을 이메일 (선택)', 'Reply email (optional)')}
          <input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} maxLength={254} placeholder="example@email.com" className="rounded-xl border border-[#e4dcd7] bg-[#fffdfb] px-4 py-3 font-normal outline-none transition focus:border-primary1 focus:ring-2 focus:ring-primary1/15" />
        </label>

        <label className="hidden" aria-hidden>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
        </label>

        {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
        <button type="submit" disabled={submitting || content.trim().length < 10} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary1 px-5 text-sm font-bold text-white transition hover:bg-primary2 disabled:cursor-not-allowed disabled:opacity-50">
          <MdSend className="h-4 w-4" aria-hidden />
          {submitting ? t('접수 중...', 'Submitting...') : t('건의 보내기', 'Submit feedback')}
        </button>
      </form>
    </section>
  );
}
