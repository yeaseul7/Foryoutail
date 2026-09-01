create or replace function public.parse_animal_birth_year(value text)
returns smallint
language plpgsql
immutable
strict
set search_path = public
as $$
declare
  parsed integer;
begin
  parsed := substring(value from '^[[:space:]]*([0-9]{4})')::integer;
  if parsed between 1900 and 2100 then
    return parsed::smallint;
  end if;
  return null;
end;
$$;

create or replace function public.parse_animal_weight_kg(value text)
returns numeric
language plpgsql
immutable
strict
set search_path = public
as $$
declare
  captured text;
  parsed numeric;
begin
  captured := substring(
    value from '^[[:space:]]*([0-9]+([.,][0-9]+)?|[.][0-9]+)[[:space:]]*[(]Kg[)][[:space:]]*$'
  );
  if captured is null then
    return null;
  end if;

  parsed := replace(captured, ',', '.')::numeric;
  if parsed > 0 and parsed <= 200 then
    return round(parsed, 2);
  end if;
  return null;
end;
$$;

alter table public.animals
  add column if not exists birth_year smallint
    generated always as (public.parse_animal_birth_year(age)) stored,
  add column if not exists weight_kg numeric(6, 2)
    generated always as (public.parse_animal_weight_kg(weight)) stored;

alter table public.animals
  add constraint animals_birth_year_check
    check (birth_year between 1900 and 2100),
  add constraint animals_weight_check
    check (weight_kg > 0 and weight_kg <= 200);

create index if not exists animals_birth_year_idx
  on public.animals (birth_year);

create index if not exists animals_weight_kg_idx
  on public.animals (weight_kg);
