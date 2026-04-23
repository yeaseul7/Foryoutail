export default function PostCardSkeleton() {
  return (
    <article className="flex overflow-hidden flex-col bg-white rounded-2xl shadow-sm animate-pulse">
      <div className="relative w-full bg-gray-200 aspect-square overflow-hidden">
        <div className="w-full h-full bg-gray-300" />
      </div>

      <div className="flex flex-col flex-1 p-2">
        <div className="mb-1.5 h-5 bg-gray-200 rounded w-3/4" />
        <div className="mb-1.5 h-5 bg-gray-200 rounded w-1/2" />

        <div className="mb-2 h-3 bg-gray-200 rounded w-full" />
        <div className="mb-2 h-3 bg-gray-200 rounded w-5/6" />

        <div className="flex justify-between items-center mt-auto">
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>

        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-2 items-center">
            <div className="w-5 h-5 bg-gray-200 rounded-full shrink-0" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>

          <div className="flex gap-2 items-center">
            <div className="w-8 h-3 bg-gray-200 rounded" />
            <div className="w-8 h-3 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </article>
  );
}
