create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid null references public.tenants(id) on delete set null,
  user_id uuid not null,
  user_email text null,
  motivo text not null,
  nota_experiencia smallint null check (nota_experiencia between 0 and 10),
  comentario text null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz null,
  failure_reason text null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists account_deletion_requests_user_id_idx
  on public.account_deletion_requests (user_id, requested_at desc);

create index if not exists account_deletion_requests_status_idx
  on public.account_deletion_requests (status, requested_at desc);

alter table public.account_deletion_requests enable row level security;

drop policy if exists account_deletion_requests_select_own on public.account_deletion_requests;
create policy account_deletion_requests_select_own
on public.account_deletion_requests
for select
to authenticated
using (auth.uid() = user_id);

revoke all on public.account_deletion_requests from anon;
grant select on public.account_deletion_requests to authenticated;
