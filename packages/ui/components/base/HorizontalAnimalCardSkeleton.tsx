export default function HorizontalAnimalCardSkeleton() {
  return (
    <article
      className="flex-shrink-0 w-[240px] sm:w-[260px] overflow-hidden mt-4"
      aria-hidden
    >
      <div className="w-full aspect-square rounded-2xl bg-gray-100 animate-pulse" />
      <div className="py-2 space-y-1.5">
        <div className="h-4 rounded bg-gray-100 animate-pulse w-4/5" />
        <div className="h-4 rounded bg-gray-100 animate-pulse w-3/5" />
      </div>
    </article>
  );
}
