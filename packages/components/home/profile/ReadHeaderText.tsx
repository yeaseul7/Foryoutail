interface ReadHeaderTextProps {
  currentName: string;
  currentDescription: string;
  onEditClick?: () => void;
  showEditButton?: boolean;
}
export default function ReadHeaderText({
  currentName,
  currentDescription,
  onEditClick,
  showEditButton = false,
}: ReadHeaderTextProps) {
  // 이메일 링크를 파란색으로 변환하는 함수
  const formatDescription = (text: string) => {
    if (!text) return null;

    // 이메일 패턴 찾기
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const parts = text.split(emailRegex);

    return parts.map((part, index) => {
      if (emailRegex.test(part)) {
        return (
          <a
            key={index}
            href={`mailto:${part}`}
            className="text-primary1 underline hover:text-primary2"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800">
          {currentName}
        </h1>
        <span className="text-base sm:text-lg lg:text-xl">🐶</span>
        {showEditButton && onEditClick && (
          <button
            onClick={onEditClick}
            className="px-2 py-1 text-xs sm:text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
          >
            프로필 수정
          </button>
        )}
      </div>
      {currentDescription && (
        <p className="text-xs sm:text-sm lg:text-base text-gray-600 whitespace-pre-wrap leading-relaxed">
          {formatDescription(currentDescription)}
        </p>
      )}
    </div>
  );
}
