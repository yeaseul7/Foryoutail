'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MdChevronLeft, MdChevronRight, MdDeleteOutline, MdLockOutline, MdSearch } from 'react-icons/md';
import { useAuth } from '@/lib/supabase/auth';
import { useLanguage } from '@/lib/i18n/language';
import { getSupabaseAccessToken } from '@/lib/supabase/client';

interface FeedbackItem {
  id: string;
  category: 'suggestion' | 'bug' | 'other';
  content: string;
  status: 'received' | 'reviewing' | 'completed';
  is_public: boolean;
  is_owner: boolean;
  created_at: string;
}

export default function FeedbackList() {
  const { user, loading: authLoading } = useAuth();
  const { isEnglish, t } = useLanguage();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | FeedbackItem['category']>('all');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getSupabaseAccessToken().catch(() => null);
      const response = await fetch('/api/feedback', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const body = await response.json().catch(() => null) as { items?: FeedbackItem[]; error?: string } | null;
      if (!response.ok) throw new Error(body?.error || t('문의 목록을 불러오지 못했습니다.', 'Could not load inquiries.'));
      setItems(body?.items ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('문의 목록을 불러오지 못했습니다.', 'Could not load inquiries.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (authLoading) return;
    void loadItems();
    const reload = () => void loadItems();
    window.addEventListener('feedback-submitted', reload);
    return () => window.removeEventListener('feedback-submitted', reload);
  }, [authLoading, loadItems, user?.uid]);

  const categoryLabel = (category: FeedbackItem['category']) => ({
    suggestion: t('개선 제안', 'Suggestion'),
    bug: t('오류 제보', 'Bug report'),
    other: t('기타', 'Other'),
  })[category];
  const statusLabel = (status: FeedbackItem['status']) => ({
    received: t('접수', 'Received'),
    reviewing: t('확인 중', 'Reviewing'),
    completed: t('완료', 'Completed'),
  })[status];

  const categories = [
    { value: 'all' as const, label: t('전체', 'All') },
    { value: 'suggestion' as const, label: t('개선 제안', 'Suggestions') },
    { value: 'bug' as const, label: t('오류 제보', 'Bug reports') },
    { value: 'other' as const, label: t('기타 문의', 'Other') },
  ];
  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    return items.filter((item) =>
      (category === 'all' || item.category === category) &&
      (!keyword || item.content.toLocaleLowerCase().includes(keyword)),
    );
  }, [category, items, search]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pageItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
    setExpandedId(null);
  }, [category, search]);

  const deleteItem = async (item: FeedbackItem) => {
    if (!item.is_owner || deletingId) return;
    if (!window.confirm(t('이 문의를 삭제할까요? 삭제 후 복구할 수 없습니다.', 'Delete this inquiry? This cannot be undone.'))) return;
    setDeletingId(item.id);
    setError('');
    try {
      const token = await getSupabaseAccessToken();
      if (!token) throw new Error(t('로그인이 필요합니다.', 'Sign in required.'));
      const response = await fetch('/api/feedback', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: item.id }),
      });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error || t('문의를 삭제하지 못했습니다.', 'Could not delete the inquiry.'));
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setExpandedId((current) => current === item.id ? null : current);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t('문의를 삭제하지 못했습니다.', 'Could not delete the inquiry.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl bg-white px-4 py-5 sm:px-7 sm:py-7">
      <label className="flex h-12 items-center gap-2 border-b border-[#ddd7d2] text-[#817873] focus-within:border-primary1">
        <MdSearch className="h-5 w-5 shrink-0 text-[#a69d98]" aria-hidden />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('무엇이든 찾아보세요', 'Search inquiries')} className="min-w-0 flex-1 bg-transparent text-sm text-[#332d2a] outline-none placeholder:text-[#aaa29d]" />
      </label>

      <div className="mt-7 grid gap-5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-8">
        <nav className="flex gap-1 overflow-x-auto pb-1 sm:flex-col sm:overflow-visible" aria-label={t('문의 분류', 'Inquiry categories')}>
          {categories.map((item) => (
            <button key={item.value} type="button" onClick={() => setCategory(item.value)} aria-pressed={category === item.value} className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm font-semibold transition sm:w-full ${category === item.value ? 'bg-primary-soft text-primary1' : 'text-[#817873] hover:bg-[#faf7f5] hover:text-[#332d2a]'}`}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          <div className="mb-2 hidden grid-cols-[1fr_6rem_5rem] gap-3 border-b border-[#eee7e2] px-3 pb-3 text-xs font-semibold text-[#9a918b] sm:grid">
            <span>{t('문의 내용', 'Inquiry')}</span>
            <span>{t('처리 상태', 'Status')}</span>
            <span>{t('등록일', 'Date')}</span>
          </div>
          {loading ? (
            <p className="py-12 text-center text-sm text-[#817873]">{t('불러오는 중...', 'Loading...')}</p>
          ) : error ? (
            <p role="alert" className="py-12 text-center text-sm text-red-600">{error}</p>
          ) : pageItems.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#817873]">{t('등록된 문의가 없습니다.', 'No inquiries yet.')}</p>
          ) : (
            <ul className="divide-y divide-[#eee7e2]">
              {pageItems.map((item) => {
                const isPrivate = !item.is_public;
                const isPrivateToViewer = isPrivate && !item.is_owner;
                const expanded = !isPrivateToViewer && expandedId === item.id;
                const date = new Intl.DateTimeFormat(isEnglish ? 'en-US' : 'ko-KR', { month: '2-digit', day: '2-digit', year: '2-digit' }).format(new Date(item.created_at));
                return (
                  <li key={item.id}>
                    <div className="flex w-full items-stretch">
                    <button type="button" disabled={isPrivateToViewer} onClick={() => setExpandedId(expanded ? null : item.id)} className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-3 px-2 py-4 text-left enabled:hover:bg-[#fffaf7] disabled:cursor-default sm:grid-cols-[1fr_6rem_5rem] sm:px-3">
                      <span className="flex min-w-0 items-center gap-2 text-sm text-[#4f4844]">
                        <span className="shrink-0 text-[11px] font-bold text-primary1">Q</span>
                        {isPrivate && <MdLockOutline className="h-3.5 w-3.5 shrink-0 text-[#817873]" aria-label={t('비공개', 'Private')} />}
                        <span className={`truncate ${isPrivateToViewer ? 'text-[#9a918b]' : ''}`}>{isPrivateToViewer ? t('비공개 문의입니다.', 'This inquiry is private.') : item.content}</span>
                      </span>
                      <span className="rounded-full bg-[#f4f1ef] px-2 py-1 text-[11px] font-semibold text-[#817873] sm:bg-transparent sm:p-0 sm:text-xs">{statusLabel(item.status)}</span>
                      <span className="hidden text-xs text-[#9a918b] sm:block">{date}</span>
                    </button>
                    </div>
                    {expanded && (
                      <div className="bg-[#fffaf7] px-5 py-5 sm:px-8">
                        <div className="mb-3 flex items-center gap-2 text-xs text-[#9a918b] sm:hidden">
                          <span>{categoryLabel(item.category)}</span><span>·</span><span>{date}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#4f4844]">{item.content}</p>
                        {item.is_owner && (
                          <div className="mt-4 flex justify-end">
                            <button type="button" onClick={() => void deleteItem(item)} disabled={deletingId === item.id} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#9a918b] transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40">
                              <MdDeleteOutline className="h-3.5 w-3.5" aria-hidden />
                              {t('삭제', 'Delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {!loading && !error && totalPages > 1 && (
            <nav className="mt-7 flex items-center justify-center gap-1 text-sm" aria-label={t('문의 페이지', 'Inquiry pages')}>
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-full p-2 text-[#817873] hover:bg-primary-soft disabled:opacity-30" aria-label={t('이전 페이지', 'Previous page')}><MdChevronLeft className="h-4 w-4" /></button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} aria-current={page === pageNumber ? 'page' : undefined} className={`h-8 w-8 rounded-full text-xs font-semibold ${page === pageNumber ? 'bg-primary-soft text-primary1' : 'text-[#817873] hover:text-primary1'}`}>{pageNumber}</button>
              ))}
              <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="rounded-full p-2 text-[#817873] hover:bg-primary-soft disabled:opacity-30" aria-label={t('다음 페이지', 'Next page')}><MdChevronRight className="h-4 w-4" /></button>
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}
