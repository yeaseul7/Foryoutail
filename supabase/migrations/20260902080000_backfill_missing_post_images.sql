insert into public.post_images (
  post_id,
  storage_path,
  image_url,
  sort_order
)
select
  post.id,
  split_part(
    post.main_image_url,
    '/storage/v1/object/public/community-images/',
    2
  ),
  post.main_image_url,
  0
from public.posts as post
where post.main_image_url like '%/storage/v1/object/public/community-images/%'
  and not exists (
    select 1
    from public.post_images as image
    where image.post_id = post.id
  );
