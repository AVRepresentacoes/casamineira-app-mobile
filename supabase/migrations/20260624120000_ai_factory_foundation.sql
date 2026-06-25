create extension if not exists pgcrypto;

create table if not exists public.ai_factory_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  status text not null default 'queued',
  dry_run boolean not null default true,
  model text,
  briefing jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  usage jsonb not null default '{}'::jsonb,
  estimated_cost_brl numeric(12, 4) not null default 0,
  approval_status text not null default 'pending',
  approval_notes text,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint ai_factory_runs_status_check check (status in ('queued', 'running', 'completed', 'failed')),
  constraint ai_factory_runs_approval_status_check check (approval_status in ('pending', 'approved', 'rejected'))
);

create table if not exists public.ai_factory_agent_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_factory_runs(id) on delete cascade,
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  agent_id text not null,
  agent_name text not null,
  status text not null default 'planned',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  usage jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint ai_factory_agent_logs_status_check check (status in ('planned', 'running', 'completed', 'failed', 'skipped'))
);

create table if not exists public.ai_factory_artifacts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_factory_runs(id) on delete cascade,
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  artifact_type text not null,
  file_path text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ai_factory_artifacts_type_check check (artifact_type in ('client_json', 'provision_sql', 'manifest', 'checklist')),
  unique (run_id, file_path)
);

create table if not exists public.ai_factory_audit_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.ai_factory_runs(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  status text not null default 'success',
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_factory_audit_logs_status_check check (status in ('success', 'denied', 'failed'))
);

create index if not exists ai_factory_runs_tenant_created_idx
  on public.ai_factory_runs (tenant_id, created_at desc);

create index if not exists ai_factory_runs_user_created_idx
  on public.ai_factory_runs (user_id, created_at desc);

create index if not exists ai_factory_agent_logs_run_idx
  on public.ai_factory_agent_logs (run_id, started_at asc);

create index if not exists ai_factory_artifacts_run_idx
  on public.ai_factory_artifacts (run_id, created_at asc);

create index if not exists ai_factory_audit_logs_tenant_created_idx
  on public.ai_factory_audit_logs (tenant_id, created_at desc);

create index if not exists ai_factory_audit_logs_run_idx
  on public.ai_factory_audit_logs (run_id, created_at desc);

grant select, insert, update on public.ai_factory_runs to authenticated;
grant select, insert, update on public.ai_factory_agent_logs to authenticated;
grant select, insert, update on public.ai_factory_artifacts to authenticated;
grant select, insert on public.ai_factory_audit_logs to authenticated;

drop trigger if exists trg_ai_factory_runs_updated_at on public.ai_factory_runs;
create trigger trg_ai_factory_runs_updated_at
before update on public.ai_factory_runs
for each row
execute function public.set_updated_at_multitenant();

create or replace function public.audit_ai_factory_run_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.approval_status is distinct from new.approval_status then
    insert into public.ai_factory_audit_logs (
      run_id,
      tenant_id,
      user_id,
      action,
      status,
      metadata
    )
    values (
      new.id,
      new.tenant_id,
      auth.uid(),
      case
        when new.approval_status = 'approved' then 'run_approved'
        when new.approval_status = 'rejected' then 'run_rejected'
        else 'run_approval_reset'
      end,
      'success',
      jsonb_build_object(
        'previousApprovalStatus', old.approval_status,
        'approvalStatus', new.approval_status,
        'approvalNotes', new.approval_notes
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_ai_factory_runs_approval_audit on public.ai_factory_runs;
create trigger trg_ai_factory_runs_approval_audit
after update of approval_status on public.ai_factory_runs
for each row
execute function public.audit_ai_factory_run_approval();

alter table public.ai_factory_runs enable row level security;
alter table public.ai_factory_agent_logs enable row level security;
alter table public.ai_factory_artifacts enable row level security;
alter table public.ai_factory_audit_logs enable row level security;

drop policy if exists ai_factory_runs_select_tenant on public.ai_factory_runs;
create policy ai_factory_runs_select_tenant
on public.ai_factory_runs
for select
to authenticated
using (
  public.user_belongs_to_tenant(tenant_id)
  or user_id = auth.uid()
  or public.is_super_admin()
);

drop policy if exists ai_factory_runs_insert_own on public.ai_factory_runs;
create policy ai_factory_runs_insert_own
on public.ai_factory_runs
for insert
to authenticated
with check (
  user_id = auth.uid()
  and tenant_id = public.current_tenant_id()
);

drop policy if exists ai_factory_runs_update_admin on public.ai_factory_runs;
create policy ai_factory_runs_update_admin
on public.ai_factory_runs
for update
to authenticated
using (
  public.is_empresa_admin(tenant_id)
  or public.is_super_admin()
)
with check (
  public.is_empresa_admin(tenant_id)
  or public.is_super_admin()
);

drop policy if exists ai_factory_agent_logs_select_tenant on public.ai_factory_agent_logs;
create policy ai_factory_agent_logs_select_tenant
on public.ai_factory_agent_logs
for select
to authenticated
using (
  public.user_belongs_to_tenant(tenant_id)
  or public.is_super_admin()
);

drop policy if exists ai_factory_agent_logs_insert_admin on public.ai_factory_agent_logs;
create policy ai_factory_agent_logs_insert_admin
on public.ai_factory_agent_logs
for insert
to authenticated
with check (
  public.is_empresa_admin(tenant_id)
  or public.is_super_admin()
);

drop policy if exists ai_factory_agent_logs_update_admin on public.ai_factory_agent_logs;
create policy ai_factory_agent_logs_update_admin
on public.ai_factory_agent_logs
for update
to authenticated
using (
  public.is_empresa_admin(tenant_id)
  or public.is_super_admin()
)
with check (
  public.is_empresa_admin(tenant_id)
  or public.is_super_admin()
);

drop policy if exists ai_factory_artifacts_select_tenant on public.ai_factory_artifacts;
create policy ai_factory_artifacts_select_tenant
on public.ai_factory_artifacts
for select
to authenticated
using (
  public.user_belongs_to_tenant(tenant_id)
  or public.is_super_admin()
);

drop policy if exists ai_factory_artifacts_insert_admin on public.ai_factory_artifacts;
create policy ai_factory_artifacts_insert_admin
on public.ai_factory_artifacts
for insert
to authenticated
with check (
  public.is_empresa_admin(tenant_id)
  or public.is_super_admin()
);

drop policy if exists ai_factory_artifacts_update_admin on public.ai_factory_artifacts;
create policy ai_factory_artifacts_update_admin
on public.ai_factory_artifacts
for update
to authenticated
using (
  public.is_empresa_admin(tenant_id)
  or public.is_super_admin()
)
with check (
  public.is_empresa_admin(tenant_id)
  or public.is_super_admin()
);

drop policy if exists ai_factory_audit_logs_select_tenant on public.ai_factory_audit_logs;
create policy ai_factory_audit_logs_select_tenant
on public.ai_factory_audit_logs
for select
to authenticated
using (
  public.user_belongs_to_tenant(tenant_id)
  or user_id = auth.uid()
  or public.is_super_admin()
);

drop policy if exists ai_factory_audit_logs_insert_admin on public.ai_factory_audit_logs;
create policy ai_factory_audit_logs_insert_admin
on public.ai_factory_audit_logs
for insert
to authenticated
with check (
  public.is_empresa_admin(tenant_id)
  or public.is_super_admin()
  or user_id = auth.uid()
);
