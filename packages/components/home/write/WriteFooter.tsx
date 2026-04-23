import { useRouter } from 'next/navigation';
import { PiArrowLeftLight } from 'react-icons/pi';

export default function WriteFooter({
  onSubmit,
  submitLabel = '작성하기',
  isSubmitting = false,
}: {
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  /** true이면 제출 버튼 비활성화(이중 제출 방지) */
  isSubmitting?: boolean;
}) {
  const router = useRouter();
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <button
        type="button"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-1 rounded-xs p-2 font-bold hover:bg-gray-200 disabled:pointer-events-none disabled:opacity-40"
        onClick={() => router.back()}
      >
        <PiArrowLeftLight />
        돌아가기
      </button>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => void onSubmit()}
        className="rounded-lg bg-primary2 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary1 disabled:pointer-events-none disabled:opacity-60 sm:px-6"
      >
        {submitLabel}
      </button>
    </div>
  );
}
