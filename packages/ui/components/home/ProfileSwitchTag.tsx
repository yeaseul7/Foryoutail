'use client';

export type ProfileCategory = 'posts' | 'favoriteShelters' | 'likedAnimals';

interface ProfileSwitchTagProps {
  category: ProfileCategory;
  setCategory: (category: ProfileCategory) => void;
  isOwnProfile?: boolean;
}

export default function ProfileSwitchTag({ category, setCategory, isOwnProfile = false }: ProfileSwitchTagProps) {
  const isPostsActive = category === 'posts';
  const isFavoriteSheltersActive = category === 'favoriteShelters';
  const isLikedAnimalsActive = category === 'likedAnimals';

  const activeIndex = isPostsActive ? 0 : isFavoriteSheltersActive ? 1 : 2;
  const sharedButtonClass =
    'relative z-10 min-w-0 flex-1 rounded-full px-2 py-2 text-center text-sm font-semibold transition-colors duration-300';

  if (!isOwnProfile) {
    return (
      <div className="flex justify-center items-center mt-4 w-full">
        <div className="relative w-full max-w-2xl rounded-full bg-gray-200 p-1">
          <div className="absolute inset-y-1 left-1 right-1 rounded-full bg-white" />
          <button
            onClick={() => setCategory('posts')}
            className={`${sharedButtonClass} text-primary1`}
          >
            게시글
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center mt-4 w-full">
      <div className="relative flex w-full max-w-2xl rounded-full bg-gray-200 p-1">
        <div
          className="absolute inset-y-1 rounded-full bg-white transition-all duration-300 ease-in-out"
          style={{
            left: `calc(4px + ((100% - 8px) / 3) * ${activeIndex})`,
            width: 'calc((100% - 8px) / 3)',
          }}
        />

        <button
          onClick={() => setCategory('posts')}
          className={`${sharedButtonClass} ${isPostsActive ? 'text-primary1' : 'text-gray-600'}`}
        >
          게시글
        </button>

        <button
          onClick={() => setCategory('favoriteShelters')}
          className={`${sharedButtonClass} ${isFavoriteSheltersActive ? 'text-primary1' : 'text-gray-600'}`}
        >
          즐겨찾기한 보호소
        </button>

        <button
          onClick={() => setCategory('likedAnimals')}
          className={`${sharedButtonClass} ${isLikedAnimalsActive ? 'text-primary1' : 'text-gray-600'}`}
        >
          좋아요한 동물
        </button>
      </div>
    </div>
  );
}
