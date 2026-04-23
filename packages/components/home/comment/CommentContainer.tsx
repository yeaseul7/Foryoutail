import { CommentData } from '@/packages/type/commentType';
import type { CommentCollectionName } from './CommentList';
import CommentHeader from './CommentHeader';
import CommentFooter from './CommentFooter';

export default function CommentContainer({
  commentData,
  postId,
  postAuthorId,
  collectionName = 'boards',
  isLoadingAuthorInfo,
}: {
  commentData: CommentData;
  postId: string;
  postAuthorId?: string;
  collectionName?: CommentCollectionName;
  isLoadingAuthorInfo?: boolean;
}) {
  const { content } = commentData;
  const isPostAuthor = postAuthorId && commentData.authorId === postAuthorId;

  return (
    <div className="flex flex-col flex-1 gap-2">
      <div className={`p-3 rounded-2xl rounded-tl-none border ${isPostAuthor
        ? 'bg-purple-50 border-purple-100'
        : 'bg-blue-50 border-blue-100'
        }`}>
        <div className="flex gap-2 items-center mb-4">
          <CommentHeader
            commentData={commentData}
            postId={postId}
            collectionName={collectionName}
            isLoadingAuthorInfo={isLoadingAuthorInfo}
          />
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{content}</p>
      </div>
      <div>
        <CommentFooter commentData={commentData} postId={postId} collectionName={collectionName} />
      </div>
    </div>
  );
}
