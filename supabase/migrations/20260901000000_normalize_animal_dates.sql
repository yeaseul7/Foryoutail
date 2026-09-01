-- 공공 API 원문(YYYYMMDD)은 유지하고 검색용 날짜를 자동 생성한다.
-- make_date는 20261399처럼 존재하지 않는 날짜를 오류로 거부한다.
alter table public.animals
  add column if not exists notice_start_date date
    generated always as (
      case
        when notice_sdt is null then null
        else make_date(
          substring(notice_sdt from 1 for 4)::integer,
          substring(notice_sdt from 5 for 2)::integer,
          substring(notice_sdt from 7 for 2)::integer
        )
      end
    ) stored,
  add column if not exists notice_end_date date
    generated always as (
      case
        when notice_edt is null then null
        else make_date(
          substring(notice_edt from 1 for 4)::integer,
          substring(notice_edt from 5 for 2)::integer,
          substring(notice_edt from 7 for 2)::integer
        )
      end
    ) stored,
  add column if not exists happened_date date
    generated always as (
      case
        when happen_dt is null then null
        else make_date(
          substring(happen_dt from 1 for 4)::integer,
          substring(happen_dt from 5 for 2)::integer,
          substring(happen_dt from 7 for 2)::integer
        )
      end
    ) stored,
  add column if not exists source_updated_at timestamptz;

alter table public.animals
  add constraint animals_notice_sdt_yyyymmdd_check
    check (notice_sdt is null or notice_sdt ~ '^[0-9]{8}$'),
  add constraint animals_notice_edt_yyyymmdd_check
    check (notice_edt is null or notice_edt ~ '^[0-9]{8}$'),
  add constraint animals_happen_dt_yyyymmdd_check
    check (happen_dt is null or happen_dt ~ '^[0-9]{8}$');

create index if not exists animals_notice_start_date_idx
  on public.animals (notice_start_date desc);

create index if not exists animals_notice_end_date_idx
  on public.animals (notice_end_date);

create index if not exists animals_happened_date_idx
  on public.animals (happened_date desc);

create index if not exists animals_source_updated_at_idx
  on public.animals (source_updated_at desc);
