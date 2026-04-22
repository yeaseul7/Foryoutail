export default function AbandonedCardSkeleton() {
  return (
    <article className="flex h-full w-full max-w-full animate-pulse flex-col overflow-hidden rounded-2xl border border-gray-100 border-b-0 bg-white shadow-sm">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-2xl bg-gray-200">
        <div className="h-full w-full bg-gray-300" />
      </div>

      <div className="flex flex-1 flex-col gap-1 px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-12 ml-auto" />
        </div>

        <div className="flex flex-col gap-1 mb-1">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>

        <div className="flex flex-col gap-1 mb-1">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>

        <div className="flex flex-col gap-1">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
      </div>
    </article>
  );
}
