export type SerializableTimestamp = {
  seconds: number;
  nanoseconds: number;
};

/** 커뮤니티 글 카테고리 (탭 id와 동일). `pet-life`는 구 데이터 호환용 */
export type PostBoardCategory = 'daily' | 'question' | 'adoption';
export type PostCategoryStored = PostBoardCategory | 'pet-life';

export interface PostData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  createdAt: SerializableTimestamp | null;
  updatedAt: SerializableTimestamp | null;
  thumbnail?: string | null; // 대표 이미지 (콘텐츠의 첫 번째 이미지)
  likes: number;
  category?: PostCategoryStored;
  viewCount?: number;
}

export type {
  AbandonmentPublicV2Response,
  ShelterAnimalBody,
  ShelterAnimalData,
  ShelterAnimalHeader,
  ShelterAnimalItem,
  ShelterAnimalItems,
  ShelterAnimalRow,
} from './shelterAnimalTypes';
