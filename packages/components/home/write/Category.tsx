'use client';

import type { PostBoardCategory } from '@/packages/type/postType';
import { Dispatch, SetStateAction } from 'react';

const OPTIONS: { id: PostBoardCategory; label: string }[] = [
  { id: 'daily', label: '일상' },
  { id: 'question', label: '질문' },
  { id: 'adoption', label: '입양후기' },
];

export default function Category({
  writeCategory,
  setWriteCategory,
}: {
  writeCategory: PostBoardCategory;
  setWriteCategory: Dispatch<SetStateAction<PostBoardCategory>>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => setWriteCategory(id)}
          className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
            writeCategory === id
              ? 'bg-primary1 text-white'
              : 'border border-gray-200 bg-white text-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
