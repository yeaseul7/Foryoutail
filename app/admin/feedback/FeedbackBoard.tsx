'use client';

import { useCallback, useEffect, useState } from 'react';
import { MdExpandLess, MdExpandMore, MdRefresh } from 'react-icons/md';
import { useAuth } from '@/lib/supabase/auth';
import { loadSupabaseBrowserConfig, supabase } from '@/lib/supabase/client';

interface FeedbackItem {
  id: string;
  user_id: string | null;
  category: 'suggestion' | 'bug' | 'other';
  content: string;
  contact_email: string | null;
  status: 'received' | 'reviewing' | 'completed';
  created_at: string;
}

const CATEGORY_LABEL = { suggestion: '개선 제안', bug: '오류 제보', other: '기타' };
const STATUS_LABEL = { received: '접수', reviewing: '확인 중', completed: '완료' };

export default function FeedbackBoard() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getToken = async () => {
    await loadSupabaseBrowserConfig();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      if (!token) throw new Error('로그인이 필요합니다.');
      const response = await fetch('/api/feedback', { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => null) as { items?: FeedbackItem[]; error?: string } | null;
      if (!response.ok) throw new Error(body?.error || '건의 목록을 불러오지 못했습니다.');
      setItems(body?.items ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '건의 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setError('로그인이 필요합니다.');
      return;
    }
    void loadItems();
  }, [authLoading, loadItems, user]);

  const updateStatus = async (id: string, status: FeedbackItem['status']) => {
    setUpdatingId(id);
    setError('');
    try {
      const token = await getToken();
      if (!token) throw new Error('로그인이 필요합니다.');
      const response = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error || '상태를 변경하지 못했습니다.');
      setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : '상태를 변경하지 못했습니다.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl py-5 sm:py-10">
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-xl font-bold text-[#332d2a] sm:text-2xl">건의함 관리</h1>
          <p className="mt-1 text-sm text-[#817873]">최근 접수된 건의 최대 100개</p>
        </div>
        <button type="button" onClick={() => void loadItems()} disabled={loading} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-[#5f5752] shadow-sm hover:bg-primary-soft disabled:opacity-50">
          <MdRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          새로고침
        </button>
      </div>

      {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      <div className="overflow-hidden rounded-2xl border border-[#eadfd7] bg-white shadow-sm">
        {loading ? (
          <p className="px-5 py-12 text-center text-sm text-[#817873]">불러오는 중...</p>
        ) : items.length === 0 && !error ? (
          <p className="px-5 py-12 text-center text-sm text-[#817873]">접수된 건의가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-[#eee7e2]">
            {items.map((item) => {
              const expanded = expandedId === item.id;
              return (
                <li key={item.id}>
                  <button type="button" onClick={() => setExpandedId(expanded ? null : item.id)} className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-4 text-left hover:bg-[#fffaf7] sm:px-5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.category === 'bug' ? 'bg-red-50 text-red-600' : 'bg-primary-soft text-primary1'}`}>{CATEGORY_LABEL[item.category]}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#332d2a]">{item.content}</span>
                      <span className="mt-1 block text-xs text-[#9a918b]">{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.created_at))} · {STATUS_LABEL[item.status]}</span>
                    </span>
                    {expanded ? <MdExpandLess className="h-5 w-5 text-[#817873]" /> : <MdExpandMore className="h-5 w-5 text-[#817873]" />}
                  </button>
                  {expanded && (
                    <div className="bg-[#fffdfb] px-4 pb-5 pt-1 sm:px-5">
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#4f4844]">{item.content}</p>
                      <dl className="mt-4 grid gap-2 text-xs text-[#817873] sm:grid-cols-2">
                        <div><dt className="inline font-semibold">답변 이메일: </dt><dd className="inline">{item.contact_email || '없음'}</dd></div>
                        <div><dt className="inline font-semibold">회원 ID: </dt><dd className="inline break-all">{item.user_id || '비회원'}</dd></div>
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(Object.keys(STATUS_LABEL) as FeedbackItem['status'][]).map((status) => (
                          <button key={status} type="button" disabled={updatingId === item.id || item.status === status} onClick={() => void updateStatus(item.id, status)} className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${item.status === status ? 'border-primary1 bg-primary1 text-white' : 'border-[#ddd3cd] bg-white text-[#5f5752] hover:border-primary1/60'} disabled:cursor-default`}>
                            {STATUS_LABEL[status]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
