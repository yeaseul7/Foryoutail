'use client';

import {
  BOARD_SUGGESTED_TAGS,
  stripTagHashes,
  toStoredTagWithHash,
} from '@/lib/community/boardSuggestedTags';
import { isEmptyOrWhitespace } from '@/lib/utils';
import type { PostBoardCategory, PostData } from '@/packages/type/postType';
import { HiHashtag, HiStar, HiXMark } from 'react-icons/hi2';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useState,
} from 'react';

const MAX_TAGS = 3;

function tagCoreEquals(a: string, b: string): boolean {
  return stripTagHashes(a) === stripTagHashes(b);
}

function emptyPostShell(tags: string[]): PostData {
  return {
    id: '',
    title: '',
    content: '',
    tags,
    authorId: '',
    authorName: '',
    authorPhotoURL: null,
    createdAt: null,
    updatedAt: null,
    likes: 0,
  };
}

export default function TagInput({
  postData,
  setPostData,
  writeCategory,
}: {
  postData: PostData | null;
  setPostData: Dispatch<SetStateAction<PostData | null>>;
  writeCategory: PostBoardCategory;
}) {
  const [value, setValue] = useState('');
  const tagCount = postData?.tags?.length ?? 0;
  const atTagLimit = tagCount >= MAX_TAGS;

  const insertTag = useCallback(
    (raw: string) => {
      const stored = toStoredTagWithHash(raw);
      if (!stored || isEmptyOrWhitespace(stripTagHashes(stored))) return;

      setPostData((prev) => {
        const currentTags = prev?.tags ?? [];
        if (currentTags.length >= MAX_TAGS) return prev;
        if (currentTags.some((t) => tagCoreEquals(t, stored))) return prev;

        if (!prev) {
          return emptyPostShell([stored]);
        }
        return { ...prev, tags: [...currentTags, stored] };
      });
      setValue('');
    },
    [setPostData],
  );

  const insertMultipleTags = useCallback(
    (rawTags: string[]) => {
      const storedList = rawTags
        .map((t) => toStoredTagWithHash(t))
        .filter((t) => t && !isEmptyOrWhitespace(stripTagHashes(t)));

      if (storedList.length === 0) return;

      setPostData((prev) => {
        const currentTags = prev?.tags ?? [];
        const room = MAX_TAGS - currentTags.length;
        if (room <= 0) return prev;

        const deduped = storedList.filter(
          (s) => !currentTags.some((t) => tagCoreEquals(t, s)),
        );
        const toAdd = deduped.slice(0, room);

        if (toAdd.length === 0) return prev;

        if (!prev) {
          return emptyPostShell(toAdd);
        }
        return { ...prev, tags: [...currentTags, ...toAdd] };
      });
    },
    [setPostData],
  );

  /** Enter / 추가 버튼에서만 호출: 쉼표로 여러 개, 최대 개수까지 */
  const commitInputTags = useCallback(() => {
    if (atTagLimit) return;
    const raw = value.trim();
    if (!raw) return;

    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !isEmptyOrWhitespace(s));

    if (parts.length === 0) return;

    insertMultipleTags(parts);
    setValue('');
  }, [atTagLimit, value, insertMultipleTags]);

  const removeTag = useCallback(
    (tag: string) => {
      setPostData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tags: (prev.tags || []).filter((t) => t !== tag),
        };
      });
    },
    [setPostData],
  );

  const tryInsertTag = useCallback(
    (raw: string) => {
      if (atTagLimit) return;
      insertTag(raw);
    },
    [atTagLimit, insertTag],
  );

  const suggested = BOARD_SUGGESTED_TAGS[writeCategory];
  const hasSelected = (postData?.tags?.length ?? 0) > 0;
  const canCommitInput = !atTagLimit && value.trim().length > 0;

  return (
    <div className="my-4 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">태그</span>
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${
            atTagLimit
              ? 'bg-amber-100 text-amber-900'
              : 'bg-white text-gray-600 ring-1 ring-gray-200'
          }`}
        >
          {tagCount}/{MAX_TAGS}
        </span>
      </div>

      {hasSelected && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {postData!.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-200 hover:bg-gray-50"
              onClick={() => {
                removeTag(tag);
              }}
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
              <HiXMark className="h-3 w-3 text-gray-400" aria-hidden />
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <HiStar className="h-3 w-3 text-sky-600" aria-hidden />
          <span className="text-xs font-semibold text-gray-800">추천</span>
        </span>
        {suggested.map((tag) => {
          const tagCore = stripTagHashes(tag);
          const selected =
            postData?.tags?.some((t) => stripTagHashes(t) === tagCore) ?? false;
          const disabled = !selected && atTagLimit;
          return (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (selected) {
                  const full = postData?.tags?.find((t) => stripTagHashes(t) === tagCore);
                  if (full) removeTag(full);
                } else {
                  tryInsertTag(tag);
                }
              }}
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                selected
                  ? 'bg-primary1 text-white'
                  : disabled
                    ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {atTagLimit ? (
        <div
          className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-center text-xs text-amber-950"
          role="status"
        >
          <span className="font-semibold">태그 {MAX_TAGS}개 선택됨</span>
          <span className="mt-0.5 block text-[11px] font-normal text-amber-900/85">
            위 태그를 눌러 지우면 다시 입력할 수 있어요
          </span>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <div className="relative min-h-[44px] min-w-0 flex-1">
            <HiHashtag
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="text"
              enterKeyHint="done"
              placeholder="입력 후 Enter 또는 추가"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  commitInputTags();
                }
              }}
              className="h-full min-h-[44px] w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-2.5 text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-primary1/40 focus:ring-1 focus:ring-primary1/30 sm:text-sm"
            />
          </div>
          <button
            type="button"
            disabled={!canCommitInput}
            onClick={() => commitInputTags()}
            className="min-h-[44px] shrink-0 rounded-lg bg-primary1 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary2 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none sm:min-w-[4.5rem]"
          >
            추가
          </button>
        </div>
      )}
    </div>
  );
}
