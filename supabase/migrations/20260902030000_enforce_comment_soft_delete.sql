-- 일반 사용자는 댓글 행을 물리 삭제하지 않고 soft_delete_comment()를 사용한다.
drop policy if exists comments_delete_owner on public.comments;
