'use client';

import { RiPencilFill } from 'react-icons/ri';
import { HiChatBubbleLeft } from 'react-icons/hi2';

export type CommunityBoardTabId = 'all' | 'daily' | 'question' | 'adoption';

const TABS: { id: CommunityBoardTabId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'daily', label: '일상' },
  { id: 'question', label: '질문' },
  { id: 'adoption', label: '입양후기' },
];

const SUBTITLE = '반려생활에 필요한 이야기와 경험을 모아보는 커뮤니티입니다.';

interface CommunityBoardHeaderProps {
  activeTab: CommunityBoardTabId;
  onTabChange: (tab: CommunityBoardTabId) => void;
  onWriteClick: () => void;
  onAskClick: () => void;
}

export default function CommunityBoardHeader({
  activeTab,
  onTabChange,
  onWriteClick,
  onAskClick,
}: CommunityBoardHeaderProps) {
  return (
    <header className="w-full px-4 pt-8 pb-6 sm:px-0">
      <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl sm:leading-snug">
        반려 일상, 질문, 입양 후기를 나누는 공간
      </h1>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white px-4 py-3.5 shadow-[0_4px_24px_rgba(15,23,42,0.07)] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5 sm:py-4">
        <p className="min-w-0 flex-1 text-sm font-normal leading-relaxed text-gray-500 sm:text-[15px]">
          {SUBTITLE}
        </p>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onWriteClick}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary1 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary2 sm:px-4 sm:text-sm"
          >
            <RiPencilFill className="h-4 w-4 shrink-0" aria-hidden />
            글쓰기
          </button>
          <button
            type="button"
            onClick={onAskClick}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-800 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50/80 sm:rounded-2xl sm:px-4 sm:text-sm"
          >
            <HiChatBubbleLeft className="h-4 w-4 shrink-0 text-primary1" aria-hidden />
            질문하기
          </button>
        </div>
      </div>

      <nav
        className="mt-6 w-full min-w-0"
        role="tablist"
        aria-label="게시글 구분"
      >
        <div className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-full bg-gray-100/95 p-1 ring-1 ring-gray-200/70 sm:flex-nowrap sm:gap-0.5">
          {TABS.map(({ id, label }) => {
            const selected = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onTabChange(id)}
                className={`min-h-[40px] shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 sm:min-h-[42px] sm:px-5 sm:text-[15px] ${selected
                  ? 'bg-primary1 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                  }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
