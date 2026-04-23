'use client';
import { Dispatch, SetStateAction } from 'react';
import { PostData } from '@/packages/type/postType';

export default function WriteBody({
  postData,
  setPostData,
}: {
  postData: PostData | null;
  setPostData: Dispatch<SetStateAction<PostData | null>>;
}) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="min-h-0 w-full flex-1 overflow-y-auto">
        <div className="min-h-full min-h-[min(30dvh,14rem)] sm:min-h-[min(36dvh,18rem)] w-full">
          <textarea
            className="w-full h-full min-h-[min(30dvh,14rem)] sm:min-h-[min(36dvh,18rem)] resize-none outline-none bg-transparent"
            placeholder="어떤 이야기를 나누고 싶으세요?"
            value={postData?.content || ''}
            onChange={(e) =>
              setPostData({ ...(postData as PostData), content: e.target.value })
            }
          />
        </div>
      </div>
    </div>
  );
}
