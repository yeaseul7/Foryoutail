import { PostData } from '@/packages/type/postType';
import WriteComment from '../home/comment/WriteComment';
import CommentList from '../home/comment/CommentList';

export type ReadFooterPostProps = {
  type: 'post';
  post: PostData;
  postId: string;
};

export type ReadFooterProps = ReadFooterPostProps;

export default function ReadFooter(props: ReadFooterProps) {
  return (
    <div className="flex flex-col w-full">
      <CommentList
        postId={props.postId}
        postAuthorId={props.post.authorId}
        collectionName="boards"
      />
      <WriteComment postId={props.postId} collectionName="boards" />
    </div>
  );
}
