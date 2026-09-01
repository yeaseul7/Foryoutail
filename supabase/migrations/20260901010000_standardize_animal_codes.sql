-- 외부 API의 한글 상태값을 DB 저장 전에 표준 코드로 변환한다.
create or replace function public.normalize_animal_process_state()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.process_state := case trim(new.process_state)
    when '공고중' then 'notice'
    when '보호중' then 'protect'
    when '종료(입양)' then 'adopted'
    when '종료(반환)' then 'returned'
    when '종료(기증)' then 'ended'
    when '종료(방사)' then 'ended'
    when '종료(안락사)' then 'ended'
    when '종료(자연사)' then 'ended'
    else trim(new.process_state)
  end;
  return new;
end;
$$;

drop trigger if exists animals_normalize_process_state on public.animals;

create trigger animals_normalize_process_state
before insert or update of process_state on public.animals
for each row
execute function public.normalize_animal_process_state();

update public.animals
set process_state = case trim(process_state)
  when '공고중' then 'notice'
  when '보호중' then 'protect'
  when '종료(입양)' then 'adopted'
  when '종료(반환)' then 'returned'
  when '종료(기증)' then 'ended'
  when '종료(방사)' then 'ended'
  when '종료(안락사)' then 'ended'
  when '종료(자연사)' then 'ended'
  else trim(process_state)
end;

alter table public.animals
  add constraint animals_process_state_check
    check (process_state in ('notice', 'protect', 'adopted', 'returned', 'ended')),
  add constraint animals_sex_cd_check
    check (sex_cd in ('M', 'F', 'Q')),
  add constraint animals_neuter_yn_check
    check (neuter_yn in ('Y', 'N', 'U'));

create index if not exists animals_process_state_idx
  on public.animals (process_state);
