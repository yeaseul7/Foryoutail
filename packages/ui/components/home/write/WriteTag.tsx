import { Editor, useEditorState } from '@tiptap/react';
import { useMemo } from 'react';
import {
  HiBars3,
  HiH1,
  HiH2,
  HiH3,
  HiItalic,
  HiMiniArrowTurnDownRight,
  HiMiniArrowUturnLeft,
  HiMiniArrowUturnRight,
  HiMiniBold,
  HiMiniListBullet,
  HiNumberedList,
  HiStrikethrough,
  HiXMark,
} from 'react-icons/hi2';
import { PiTextAlignCenterLight } from 'react-icons/pi';

export default function WriteTag({ editor }: { editor: Editor }) {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        isBold: ctx.editor.isActive('bold') ?? false,
        canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
        isItalic: ctx.editor.isActive('italic') ?? false,
        canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
        isStrike: ctx.editor.isActive('strike') ?? false,
        canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
        isCode: ctx.editor.isActive('code') ?? false,
        canCode: ctx.editor.can().chain().toggleCode().run() ?? false,
        canClearMarks: ctx.editor.can().chain().unsetAllMarks().run() ?? false,
        isParagraph: ctx.editor.isActive('paragraph') ?? false,
        isHeading1: ctx.editor.isActive('heading', { level: 1 }) ?? false,
        isHeading2: ctx.editor.isActive('heading', { level: 2 }) ?? false,
        isHeading3: ctx.editor.isActive('heading', { level: 3 }) ?? false,
        isHeading4: ctx.editor.isActive('heading', { level: 4 }) ?? false,
        isHeading5: ctx.editor.isActive('heading', { level: 5 }) ?? false,
        isHeading6: ctx.editor.isActive('heading', { level: 6 }) ?? false,
        isBulletList: ctx.editor.isActive('bulletList') ?? false,
        isOrderedList: ctx.editor.isActive('orderedList') ?? false,
        isCodeBlock: ctx.editor.isActive('codeBlock') ?? false,
        isBlockquote: ctx.editor.isActive('blockquote') ?? false,
        canUndo: ctx.editor.can().chain().undo().run() ?? false,
        canRedo: ctx.editor.can().chain().redo().run() ?? false,
      };
    },
  });
  const menuButtonStyle = useMemo(() => {
    return 'flex flex-col items-center justify-center p-1 text-text3';
  }, []);

  return (
    <div className="flex gap-2 items-center overflow-x-auto w-full">
      <div className="flex gap-2 items-center h-fit min-w-max">
        {typeof editor.commands.setTextAlign === 'function' && (
          <>
            <button
              onClick={() => {
                try {
                  editor.commands.setTextAlign('center');
                } catch (error) {
                  console.error('setTextAlign error:', error);
                }
              }}
              className={
                editor.isActive({ textAlign: 'center' })
                  ? 'is-active'
                  : menuButtonStyle
              }
            >
              <PiTextAlignCenterLight />
            </button>
            <button
              onClick={() => {
                try {
                  editor.commands.unsetTextAlign();
                } catch (error) {
                  console.error('unsetTextAlign error:', error);
                }
              }}
              className={menuButtonStyle}
            >
              <HiBars3 />
            </button>
          </>
        )}
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={editorState.isHeading1 ? 'is-active' : menuButtonStyle}
        >
          <HiH1 />
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={editorState.isHeading2 ? 'is-active' : menuButtonStyle}
        >
          <HiH2 />
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={editorState.isHeading5 ? 'is-active' : menuButtonStyle}
        >
          <HiH3 />
        </button>

        <div className="border-r-2 border-text3"></div>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editorState.canBold}
          className={editorState.isBold ? 'is-active' : menuButtonStyle}
        >
          <HiMiniBold />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editorState.canItalic}
          className={editorState.isItalic ? 'is-active' : menuButtonStyle}
        >
          <HiItalic />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editorState.canStrike}
          className={editorState.isStrike ? 'is-active' : menuButtonStyle}
        >
          <HiStrikethrough />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editorState.isBulletList ? 'is-active' : menuButtonStyle}
        >
          <HiMiniListBullet />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editorState.isOrderedList ? 'is-active' : menuButtonStyle}
        >
          <HiNumberedList />
        </button>

        <button
          onClick={() => editor.chain().focus().setHardBreak().run()}
          className={menuButtonStyle}
        >
          <HiMiniArrowTurnDownRight />
        </button>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editorState.canUndo}
          className={menuButtonStyle}
        >
          <HiMiniArrowUturnLeft />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editorState.canRedo}
          className={menuButtonStyle}
        >
          <HiMiniArrowUturnRight />
        </button>
        <button
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          className={menuButtonStyle}
        >
          <HiXMark className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
