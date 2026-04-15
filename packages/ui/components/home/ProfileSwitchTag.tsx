'use client';

export type ProfileCategory = 'posts' | 'shelter';

interface ProfileSwitchTagProps {
  category: ProfileCategory;
  setCategory: (category: ProfileCategory) => void;
  isOwnProfile?: boolean;
}

export default function ProfileSwitchTag({ category, setCategory, isOwnProfile = false }: ProfileSwitchTagProps) {
  const isPostsActive = category === 'posts';
  const isShelterActive = category === 'shelter';

  const pillWidth = 'calc((100% - 8px) / 2)';
  const pillLeft = {
    posts: '4px',
    shelter: 'calc(4px + (100% - 8px) / 2)',
  };
  const activeLeft = isPostsActive ? pillLeft.posts : pillLeft.shelter;

  if (!isOwnProfile) {
    return (
      <div className="flex justify-center items-center mt-4 w-full">
        <div className="relative flex bg-gray-200 rounded-full p-1 w-fit">
          <div className="absolute inset-0 top-1 bottom-1 left-1 right-1 rounded-full bg-white" />
          <button
            onClick={() => setCategory('posts')}
            className="relative z-10 px-6 py-2 rounded-full text-sm font-semibold text-primary1 whitespace-nowrap"
          >
            게시글
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center mt-4 w-full">
      <div className="relative flex bg-gray-200 rounded-full p-1 w-fit">
        <div
          className="absolute top-1 bottom-1 rounded-full bg-white transition-all duration-300 ease-in-out"
          style={{ width: pillWidth, left: activeLeft }}
        />

        <button
          onClick={() => setCategory('posts')}
          className={`relative z-10 px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-300 whitespace-nowrap ${
            isPostsActive ? 'text-primary1' : 'text-gray-600'
          }`}
        >
          게시글
        </button>

        <button
          onClick={() => setCategory('shelter')}
          className={`relative z-10 px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-300 whitespace-nowrap ${
            isShelterActive ? 'text-primary1' : 'text-gray-600'
          }`}
        >
          구조 동물
        </button>
      </div>
    </div>
  );
}
