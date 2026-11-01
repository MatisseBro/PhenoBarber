-- PHENO&CO - Correctifs de normalisation téléphone et pagination clients.
-- À appliquer uniquement après 003_security_hardening.sql, d'abord sur staging.
-- Le contrôle des collisions précède toute mise à jour des téléphones.

begin;

do $$
begin
  if exists (
    with raw_digits as (
      select id,
             case when telephone ~ '^[0-9+[:space:]().-]{7,30}$'
               then regexp_replace(telephone, '[^0-9]', '', 'g') end as digits
      from public.clients
    ), normalized as (
      select id,
        case
          when length(case
            when left(digits, 2) = '00' then substring(digits from 3)
            when left(digits, 1) = '0' and length(digits) = 10 then '33' || substring(digits from 2)
            else digits
          end) between 7 and 15
          then '+' || case
            when left(digits, 2) = '00' then substring(digits from 3)
            when left(digits, 1) = '0' and length(digits) = 10 then '33' || substring(digits from 2)
            else digits
          end
          else null
        end as phone
      from raw_digits
    )
    select phone
    from normalized
    where phone is not null
    group by phone
    having count(*) > 1
  ) then
    raise exception 'Migration interrompue : collisions de téléphones normalisés dans clients';
  end if;
end $$;

drop index if exists public.clients_telephone_normalized_unique;

with raw_digits as (
  select id,
         case when telephone ~ '^[0-9+[:space:]().-]{7,30}$'
           then regexp_replace(telephone, '[^0-9]', '', 'g') end as digits
  from public.clients
), normalized as (
  select id,
    case
      when length(case
        when left(digits, 2) = '00' then substring(digits from 3)
        when left(digits, 1) = '0' and length(digits) = 10 then '33' || substring(digits from 2)
        else digits
      end) between 7 and 15
      then '+' || case
        when left(digits, 2) = '00' then substring(digits from 3)
        when left(digits, 1) = '0' and length(digits) = 10 then '33' || substring(digits from 2)
        else digits
      end
      else null
    end as phone
  from raw_digits
)
update public.clients as clients
set telephone_normalized = normalized.phone
from normalized
where clients.id = normalized.id
  and clients.telephone_normalized is distinct from normalized.phone;

create unique index clients_telephone_normalized_unique
  on public.clients (telephone_normalized)
  where telephone_normalized is not null;

create or replace function public.search_clients_admin(
  p_query text,
  p_activity text,
  p_sort text,
  p_offset integer,
  p_limit integer
)
returns table(
  id text, nom text, email text, telephone text, rdv_count integer,
  location_count integer, last_rdv_at timestamptz, created_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with filtered as materialized (
    select c.id, c.nom, c.email, c.telephone, c.rdv_count, c.location_count,
           c.last_rdv_at, c.created_at
    from public.clients c
    where (
      coalesce(p_query, '') = ''
      or c.nom ilike '%' || p_query || '%'
      or c.email ilike '%' || p_query || '%'
      or c.telephone ilike '%' || p_query || '%'
    )
    and case p_activity
      when 'rdv' then c.rdv_count > 0
      when 'location' then c.location_count > 0
      when 'inactive' then c.last_rdv_at is null or c.last_rdv_at < now() - interval '90 days'
      else true
    end
  ), counted as (
    select count(*)::bigint as total_count from filtered
  ), page as (
    select f.* from filtered f
    order by
      case when p_sort = 'name' then lower(f.nom) end asc,
      case when p_sort = 'rdv' then f.rdv_count end desc,
      case when p_sort = 'rdv' then lower(f.nom) end asc,
      case when p_sort = 'recent' then f.last_rdv_at end desc nulls last,
      f.id asc
    offset greatest(coalesce(p_offset, 0), 0)
    limit least(greatest(coalesce(p_limit, 30), 1), 100)
  )
  select page.id, page.nom, page.email, page.telephone, page.rdv_count,
         page.location_count, page.last_rdv_at, page.created_at, counted.total_count
  from counted left join page on true
  order by
    case when p_sort = 'name' then lower(page.nom) end asc,
    case when p_sort = 'rdv' then page.rdv_count end desc,
    case when p_sort = 'rdv' then lower(page.nom) end asc,
    case when p_sort = 'recent' then page.last_rdv_at end desc nulls last,
    page.id asc;
$$;

revoke all on function public.search_clients_admin(text, text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.search_clients_admin(text, text, text, integer, integer) to service_role;

commit;
