export default function WriteContainerSkeleton() {
  return (
    <div className="grid w-full h-full min-h-0 grid-cols-1 lg:grid-cols-[7fr_3fr] gap-4">
      <div className="flex flex-col w-full h-full min-h-0">
        <div className="flex flex-col flex-1 min-h-0 p-4 sm:p-6 lg:p-8 bg-white rounded-2xl animate-pulse"
          style={{ boxShadow: '0 0 6px 0 rgba(0, 0, 0, 0.05)' }}
        >
          {/* 헤더 영역 */}
          <div className="shrink-0 mb-4">
            <div className="h-10 bg-gray-200 rounded w-full mb-4" />
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 rounded-full w-20" />
              <div className="h-8 bg-gray-200 rounded-full w-20" />
            </div>
          </div>

          {/* 에디터 툴바 영역 */}
          <div className="shrink-0 mb-4">
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded w-8" />
              ))}
            </div>
          </div>

          {/* 에디터 영역 */}
          <div className="flex-1 min-h-0 bg-gray-50 rounded p-4">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-32 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </div>

          {/* 태그 영역 */}
          <div className="shrink-0 mt-4">
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
        </div>

        {/* 푸터 영역 */}
        <div className="flex justify-end items-center w-full shrink-0 mt-4">
          <div className="h-10 bg-gray-200 rounded w-24" />
        </div>
      </div>

      {/* 사이드바 영역 */}
      <div className="min-h-0 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
