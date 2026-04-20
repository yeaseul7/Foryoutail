'use client';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, Dispatch, SetStateAction } from 'react';
import WriteTag from './WriteTag';
import { Placeholder } from '@tiptap/extensions';
import TextAlign from '@tiptap/extension-text-align';
import { ResizableImage } from '@/components/tiptap-node/resizable-image/resizable-image-extension';
import { PostData } from '@/packages/type/postType';

export default function WriteBody({
  postData,
  setPostData,
}: {
  postData: PostData | null;
  setPostData: Dispatch<SetStateAction<PostData | null>>;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '어떤 이야기를 나누고 싶으세요?',
        emptyEditorClass: 'is-editor-empty',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      ResizableImage.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          style: 'max-width: 100%; display: block;',
        },
      }),
    ],
    content: postData?.content || '',
    onUpdate: ({ editor }) => {
      setPostData({ ...(postData as PostData), content: editor.getHTML() });
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && postData?.content) {
      const currentContent = editor.getHTML();
      if (currentContent !== postData.content) {
        editor.commands.setContent(postData.content);
      }
    }
  }, [editor, postData?.content]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {editor && (
        <div className="mb-4 shrink-0">
          <WriteTag editor={editor as Editor} />
        </div>
      )}
      <div className="min-h-0 w-full flex-1 overflow-y-auto">
        {editor && (
          <div className="min-h-full min-h-[min(30dvh,14rem)] sm:min-h-[min(36dvh,18rem)]">
            <EditorContent editor={editor} className="tiptap" />
          </div>
        )}
      </div>
    </div>
  );
}
