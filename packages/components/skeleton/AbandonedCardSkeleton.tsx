export default function AbandonedCardSkeleton() {
  return (
    <article className="flex h-full w-full max-w-full animate-pulse flex-col overflow-hidden rounded-xl border-2 border-[#bfd7e8] bg-white shadow-sm">
      <div className="relative aspect-square w-full overflow-hidden bg-gray-200">
        <div className="h-full w-full bg-gray-300" />
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-3">
        <div className="h-4 w-2/3 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
        <div className="h-3 w-4/5 rounded bg-gray-200" />
      </div>
    </article>
  );
}
