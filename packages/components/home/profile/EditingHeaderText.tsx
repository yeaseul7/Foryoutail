interface EditingHeaderTextProps {
  editedName: string;
  setEditedName: (value: string) => void;
  editedDescription: string;
  setEditedDescription: (value: string) => void;
  handleSave: () => void;
  handleCancel: () => void;
  isSaving: boolean;
  isUploading: boolean;
  isOwnProfile: boolean;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
}
export default function EditingHeaderText({
  editedName,
  setEditedName,
  editedDescription,
  setEditedDescription,
}: EditingHeaderTextProps) {
  return (
    <div className="flex flex-col gap-2 sm:gap-3 w-full">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          className="px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2 flex-1 text-base sm:text-xl lg:text-2xl font-bold rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary1 transition-all"
          placeholder="이름"
        />
      </div>
      <textarea
        value={editedDescription}
        onChange={(e) => setEditedDescription(e.target.value)}
        className="px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2 w-full text-xs sm:text-sm lg:text-base rounded-lg border border-gray-300 resize-none text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary1 transition-all"
        placeholder="한 줄 소개"
        rows={3}
      />
    </div>
  );
}
