import type { Timestamp } from 'firebase/firestore';

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
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  thumbnail?: string | null; // 대표 이미지 (콘텐츠의 첫 번째 이미지)
  likes: number;
  category?: PostCategoryStored;
}

export type {
  AbandonmentPublicV2Response,
  ShelterAnimalBody,
  ShelterAnimalData,
  ShelterAnimalFirestoreDoc,
  ShelterAnimalHeader,
  ShelterAnimalItem,
  ShelterAnimalItems,
} from './shelterAnimalTypes';
