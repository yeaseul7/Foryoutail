import type { SerializableTimestamp } from './postType';

export interface CommentData {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  content: string;
  createdAt: SerializableTimestamp | null;
  likes?: number;
}

export interface ReplyData {
  id: string;
  authorId: string;
  content: string;
  createdAt: SerializableTimestamp | null;
  likes?: number;
}
