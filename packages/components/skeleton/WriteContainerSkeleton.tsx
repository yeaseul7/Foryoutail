export default function WriteContainerSkeleton() {
  return (
    <div className="grid w-full h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">
      <div className="flex h-full min-h-0 w-full flex-col">
        <div
          className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white p-4 animate-pulse sm:p-6 lg:p-8"
          style={{ boxShadow: '0 0 6px 0 rgba(0, 0, 0, 0.05)' }}
        >
          <div className="mb-4 shrink-0">
            <div className="mb-3 h-8 w-36 rounded-xl bg-gray-200" />
            <div className="flex flex-wrap gap-2">
              <div className="h-9 w-24 rounded-full bg-[#eef3ff]" />
              <div className="h-9 w-24 rounded-full bg-[#eef3ff]" />
              <div className="h-9 w-28 rounded-full bg-[#eef3ff]" />
            </div>
          </div>

          <div className="mb-4 shrink-0">
            <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-[#fbfcff] p-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-8 w-8 rounded-lg bg-gray-200" />
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 rounded-2xl border border-gray-100 bg-[#fcfcfd] p-4">
            <div className="space-y-3">
              <div className="h-5 w-2/5 rounded-lg bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-11/12 rounded bg-gray-200" />
              <div className="h-4 w-4/5 rounded bg-gray-200" />
              <div className="h-44 w-full rounded-2xl bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-5/6 rounded bg-gray-200" />
            </div>
          </div>

          <div className="mt-4 shrink-0">
            <div className="mb-2 h-4 w-20 rounded bg-gray-200" />
            <div className="flex flex-wrap gap-2">
              <div className="h-8 w-20 rounded-full border border-[#d8e2ff] bg-[linear-gradient(180deg,#f7faff_0%,#eef3ff_100%)]" />
              <div className="h-8 w-24 rounded-full border border-[#d8e2ff] bg-[linear-gradient(180deg,#f7faff_0%,#eef3ff_100%)]" />
              <div className="h-8 w-16 rounded-full border border-[#d8e2ff] bg-[linear-gradient(180deg,#f7faff_0%,#eef3ff_100%)]" />
            </div>
          </div>

          <div className="mt-4 shrink-0 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="h-4 w-40 rounded bg-gray-200" />
              <div className="h-11 w-28 rounded-xl bg-[#dbe4ff]" />
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse rounded-2xl bg-white p-6">
          <div className="mb-4 h-6 w-32 rounded bg-gray-200" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
            <div className="h-4 w-4/5 rounded bg-gray-200" />
            <div className="h-24 rounded-2xl bg-[#f6f8fc]" />
          </div>
        </div>
      </div>
    </div>
  );
}
