import UserProfile from '../../common/UserProfile';

interface EditingHeaderProps {
  currentPhotoURL: string | null;
  currentName: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageRemove: () => void;
  isUploading: boolean;
}
export default function EditingHeader({
  currentPhotoURL,
  currentName,
  fileInputRef,
  handleImageChange,
  handleImageRemove,
  isUploading,
}: EditingHeaderProps) {
  return (
    <div className="flex relative flex-col items-center">
      <UserProfile
        profileUrl={currentPhotoURL || ''}
        profileName={currentName || ''}
        imgSize={144}
        sizeClass="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32"
        existName={false}
        iconSize="text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />
      <div className="flex flex-col gap-2 items-center mt-3 sm:mt-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-3 py-1.5 sm:px-4 sm:py-2 w-full sm:w-auto min-w-[120px] sm:min-w-[140px] lg:min-w-[160px] text-xs sm:text-sm font-bold text-white rounded bg-primary1 hover:bg-primary2 disabled:opacity-50 transition-colors"
        >
          {isUploading ? '업로드 중...' : '이미지 변경'}
        </button>
        <button
          onClick={handleImageRemove}
          className="px-3 py-1.5 sm:px-4 sm:py-2 w-full sm:w-auto min-w-[120px] sm:min-w-[140px] lg:min-w-[160px] text-xs sm:text-sm font-bold text-primary1 hover:text-primary2 transition-colors"
        >
          이미지 제거
        </button>
      </div>
    </div>
  );
}
