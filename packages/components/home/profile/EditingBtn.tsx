interface EditingBtnProps {
  handleSave: () => void;
  handleCancel: () => void;
  isSaving: boolean;
  isUploading: boolean;
  isOwnProfile: boolean;
  isEditing: boolean;
}
export default function EditingBtn({
  handleSave,
  handleCancel,
  isSaving,
  isUploading,
  isOwnProfile,
  isEditing,
}: EditingBtnProps) {
  // 편집 모드일 때만 표시 (저장/취소 버튼)
  if (!isEditing || !isOwnProfile) {
    return null;
  }

  return (
    <div className="flex gap-2 justify-end w-full mt-2">
      <button
        onClick={handleSave}
        disabled={isSaving || isUploading}
        className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-white rounded-lg bg-primary1 hover:bg-primary2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSaving ? '저장 중...' : '저장'}
      </button>
      <button
        onClick={handleCancel}
        disabled={isSaving || isUploading}
        className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        취소
      </button>
    </div>
  );
}
