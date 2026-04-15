export default function RegionalNearbyAnimalCardSkeleton() {
  return (
    <div
      className="flex flex-col items-center gap-3 sm:gap-3.5 shrink-0 w-[178px] sm:w-[208px]"
      aria-hidden
    >
      <div className="w-[168px] h-[168px] sm:w-[196px] sm:h-[196px] rounded-full bg-gray-200/90 animate-pulse shadow-[0_5px_20px_rgba(0,0,0,0.12)]" />
      <div className="h-4 w-[6.5rem] rounded-md bg-gray-200/90 animate-pulse" />
      <div className="h-4 w-[7rem] rounded-md bg-gray-200/80 animate-pulse" />
    </div>
  );
}
