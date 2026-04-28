'use client';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import EditingHeader from './EditingHeader';
import EditingHeaderText from './EditingHeaderText';
import EditingBtn from './EditingBtn';
import ReadHeaderText from './ReadHeaderText';
import ReasHeaderImg from './ReasHeaderImg';

interface ProfileUser {
  uid: string;
  displayName: string;
  photoURL: string | null;
  email: string;
}

const PROFILE_IMAGE_BUCKET = 'board-images';

export default function UserHeader() {
  const params = useParams();
  const userId = params.id as string;
  const { user, updateUserProfile } = useAuth();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [description, setDescription] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState<string>('');
  const [editedDescription, setEditedDescription] = useState<string>('');
  const [editedPhotoURL, setEditedPhotoURL] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postsCount, setPostsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = user?.uid === userId;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/supabase/users/sync?id=${encodeURIComponent(userId)}`,
        );
        if (!response.ok) {
          throw new Error('사용자 조회에 실패했습니다.');
        }
        const result = (await response.json()) as {
          user?: {
            id: string;
            email: string | null;
            nickname: string | null;
            profile_img: string | null;
          } | null;
        };
        if (result.user) {
          setProfileUser({
            uid: userId,
            displayName: result.user.nickname || '',
            photoURL: result.user.profile_img || null,
            email: result.user.email || '',
          });
          setDescription('');
          setEditedName(result.user.nickname || '');
          setEditedDescription('');
          setEditedPhotoURL(result.user.profile_img || null);
        }

        const { count, error } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', userId);

        if (error) {
          throw error;
        }

        setPostsCount(count ?? 0);

        // 팔로워/팔로잉은 아직 구현되지 않았으므로 0으로 설정
        setFollowersCount(0);
        setFollowingCount(0);
      } catch (error) {
        console.error('사용자 프로필 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.uid}/profile.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(PROFILE_IMAGE_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(PROFILE_IMAGE_BUCKET)
        .getPublicUrl(path);

      if (!data.publicUrl) {
        throw new Error('프로필 이미지 URL 생성에 실패했습니다.');
      }

      setEditedPhotoURL(data.publicUrl);
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageRemove = () => {
    setEditedPhotoURL(null);
  };

  const handleSave = async () => {
    if (!isOwnProfile || !user || !userId) return;
    if (!editedName.trim()) {
      alert('이름은 필수입니다.');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName: editedName.trim(),
        photoURL: editedPhotoURL || null,
      });

      if (profileUser) {
        setProfileUser({
          ...profileUser,
          displayName: editedName.trim(),
          photoURL: editedPhotoURL,
        });
      }
      setDescription(editedDescription.trim());

      setIsEditing(false);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      alert('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedName(profileUser?.displayName || '');
    setEditedDescription(description);
    setEditedPhotoURL(profileUser?.photoURL || null);
    setIsEditing(false);
  };

  // 편집 모드일 때는 editedPhotoURL을 직접 사용 (null이면 이미지 없음)
  // 편집 모드가 아닐 때는 profileUser의 photoURL 사용
  const currentPhotoURL = isEditing ? editedPhotoURL : profileUser?.photoURL;
  const currentName = isEditing ? editedName : profileUser?.displayName || '';
  const currentDescription = isEditing ? editedDescription : description;

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-16 mb-4 w-full">
        <div className="text-gray-500">프로필을 불러오는 중...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex justify-center items-center mt-16 mb-4 w-full">
        <div className="text-gray-500">사용자를 찾을 수 없습니다.</div>
      </div>
    );
  }

  // 숫자 포맷팅 함수 (1.2k 형식)
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="mt-12 mb-4 w-full">
      <div className="flex gap-4 justify-start items-start w-full">
        {isEditing ? (
          <EditingHeader
            currentPhotoURL={currentPhotoURL ?? null}
            currentName={currentName}
            fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
            handleImageChange={handleImageChange}
            handleImageRemove={handleImageRemove}
            isUploading={isUploading}
          />
        ) : (
          <ReasHeaderImg
            currentPhotoURL={currentPhotoURL || ''}
            currentName={currentName}
          />
        )}

        <div className="flex flex-col gap-3 flex-1 w-full">
          {isEditing ? (
            <>
              <EditingHeaderText
                editedName={editedName}
                setEditedName={setEditedName}
                editedDescription={editedDescription}
                setEditedDescription={setEditedDescription}
                handleSave={handleSave}
                handleCancel={handleCancel}
                isSaving={isSaving}
                isUploading={isUploading}
                isOwnProfile={isOwnProfile}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
              />
              <EditingBtn
                handleSave={handleSave}
                handleCancel={handleCancel}
                isSaving={isSaving}
                isUploading={isUploading}
                isOwnProfile={isOwnProfile}
                isEditing={isEditing}
              />
            </>
          ) : (
            <>
              <ReadHeaderText
                currentName={currentName}
                currentDescription={currentDescription}
                onEditClick={() => setIsEditing(true)}
                showEditButton={isOwnProfile}
              />
              
              {/* 통계 섹션 */}
              <div className="flex items-center gap-3 sm:gap-6 pt-2">
                <div className="flex flex-col items-start">
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{formatNumber(postsCount)}</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 uppercase">Posts</span>
                </div>
                <div className="h-6 sm:h-8 w-px bg-gray-300" />
                <div className="flex flex-col items-start">
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{formatNumber(followersCount)}</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 uppercase">Followers</span>
                </div>
                <div className="h-6 sm:h-8 w-px bg-gray-300" />
                <div className="flex flex-col items-start">
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{formatNumber(followingCount)}</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 uppercase">Following</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
