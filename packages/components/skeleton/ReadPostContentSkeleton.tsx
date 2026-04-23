export default function ReadPostContentSkeleton() {
  return (
    <div className="w-full px-0 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="h-10 w-24 bg-gray-200 rounded mb-4 animate-pulse" />
        
        <div className="relative w-full">
          <article className="px-4 py-0 w-full sm:px-6 sm:py-2 lg:px-8 lg:py-3">
            {/* 헤더 영역 */}
            <div className="mb-6">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
              </div>
            </div>

            {/* 콘텐츠 영역 */}
            <div className="max-w-none prose prose-sm sm:prose-base lg:prose-lg">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                <div className="h-64 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              </div>
            </div>

            {/* 좋아요 영역 */}
            <div className="flex gap-4 items-center mt-6">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </article>
        </div>

        {/* 푸터 영역 */}
        <div className="mt-8 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
