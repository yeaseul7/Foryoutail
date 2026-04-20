export default function HorizontalAnimalCardSkeleton({
  photoOnly = false,
}: {
  /** true면 이미지 비율 영역만(최근 인기 많은 아이 모음 등) */
  photoOnly?: boolean;
}) {
  return (
    <article
      className="flex-shrink-0 w-[220px] sm:w-[250px] mt-4 rounded-2xl overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
      aria-hidden
    >
      <div className="w-full aspect-[4/5] bg-gray-200 animate-pulse" />

      {!photoOnly && (
        <div className="px-3 py-2.5">
          <div className="mb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="h-[15px] rounded bg-gray-200 animate-pulse w-3/5" />
              <div className="h-[12px] rounded bg-gray-200 animate-pulse w-1/4" />
            </div>
            <div className="h-[12px] rounded bg-gray-200 animate-pulse w-4/5 mt-1" />
          </div>
          <div className="flex gap-1">
            <div className="h-[22px] rounded-full bg-gray-200 animate-pulse w-12" />
            <div className="h-[22px] rounded-full bg-gray-200 animate-pulse w-20" />
          </div>
        </div>
      )}
    </article>
  );
}
