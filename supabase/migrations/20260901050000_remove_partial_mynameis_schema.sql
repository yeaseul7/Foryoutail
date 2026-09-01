drop policy if exists "owners upload pet photos" on storage.objects;
drop policy if exists "owners read pet photo objects" on storage.objects;
drop policy if exists "owners delete pet photos" on storage.objects;
drop policy if exists "owners upload dog images" on storage.objects;
drop policy if exists "owners update dog images" on storage.objects;
drop policy if exists "owners delete dog images" on storage.objects;

drop table if exists public.dog_care_profiles cascade;
drop table if exists public.share_links cascade;
drop table if exists public.dog_images cascade;
drop table if exists public.dogs cascade;
drop table if exists public.pet_photos cascade;
drop table if exists public.pets cascade;
