/** 보호소 목록 카드 스켈레톤 — `ShelterPosts` 카드형 목록과 동일한 외곽 */
export default function ShelterCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-40 max-w-[65%] rounded bg-gray-200" />
        <div className="flex shrink-0 items-center gap-2">
          <div className="h-3 w-10 rounded bg-gray-200" />
          <div className="h-5 w-5 shrink-0 rounded-full bg-gray-100" />
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="mt-0.5 h-3 w-3 shrink-0 rounded bg-gray-200" />
            <div className="h-3 flex-1 rounded bg-gray-200" />
          </div>
          <div className="flex gap-2">
            <div className="h-3 w-3 shrink-0 rounded bg-gray-200" />
            <div className="h-3 w-28 rounded bg-gray-200" />
          </div>
        </div>
        <div className="h-9 w-[4.75rem] shrink-0 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}
