begin;

create table if not exists public.guild_members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 50),
  role text not null default 'Member' check (role in ('Guild Master', 'Officer', 'Veteran', 'Member')),
  specialty text not null default '',
  fame text not null default '0',
  last_active text not null default 'New member',
  online boolean not null default false,
  avatar text not null default '',
  avatar_tone text not null default 'gold' check (avatar_tone in ('ember', 'violet', 'blue', 'sage', 'gold', 'rose')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists guild_members_normalized_name_idx
  on public.guild_members (lower(trim(name)));

create table if not exists public.guild_builds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.authuser (id) on delete set null,
  name text not null unique check (length(trim(name)) between 1 and 100),
  role text not null default 'Balanced',
  style text not null check (style in ('PvP', 'ZvZ', 'PvE', 'Gathering')),
  description text not null default '',
  specialty text not null default '',
  build jsonb not null default '{"gear":[],"skills":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.guild_builds
  add column if not exists owner_id uuid references public.authuser (id) on delete set null;
create index if not exists guild_builds_owner_id_idx on public.guild_builds (owner_id);

create table if not exists public.member_builds (
  member_id uuid primary key references public.guild_members (id) on delete cascade,
  build jsonb not null check (jsonb_typeof(build) = 'object'),
  updated_at timestamptz not null default now()
);

create table if not exists public.guild_rules (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 100),
  category text not null default 'Community',
  description text not null check (length(trim(description)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guild_guides (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 150),
  category text not null default 'General',
  summary text not null check (length(trim(summary)) between 1 and 500),
  content text not null check (length(trim(content)) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guild_activities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 150),
  category text not null default 'Guild event',
  description text not null default '',
  location text not null default '',
  starts_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guild_activities_starts_at_idx
  on public.guild_activities (starts_at);

create table if not exists public.guild_bank_transactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.guild_members (id) on delete restrict,
  type text not null check (type in ('Deposit', 'Withdraw')),
  amount bigint not null check (amount > 0),
  note text not null default '' check (length(note) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists guild_bank_transactions_created_at_idx
  on public.guild_bank_transactions (created_at desc);
create index if not exists guild_bank_transactions_member_id_idx
  on public.guild_bank_transactions (member_id);

create or replace function public.set_guild_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists guild_members_updated_at on public.guild_members;
create trigger guild_members_updated_at
  before update on public.guild_members
  for each row execute function public.set_guild_updated_at();

drop trigger if exists guild_builds_updated_at on public.guild_builds;
create trigger guild_builds_updated_at
  before update on public.guild_builds
  for each row execute function public.set_guild_updated_at();

drop trigger if exists member_builds_updated_at on public.member_builds;
create trigger member_builds_updated_at
  before update on public.member_builds
  for each row execute function public.set_guild_updated_at();

drop trigger if exists guild_rules_updated_at on public.guild_rules;
create trigger guild_rules_updated_at
  before update on public.guild_rules
  for each row execute function public.set_guild_updated_at();

drop trigger if exists guild_guides_updated_at on public.guild_guides;
create trigger guild_guides_updated_at
  before update on public.guild_guides
  for each row execute function public.set_guild_updated_at();

drop trigger if exists guild_activities_updated_at on public.guild_activities;
create trigger guild_activities_updated_at
  before update on public.guild_activities
  for each row execute function public.set_guild_updated_at();

alter table public.guild_members enable row level security;
revoke all on public.guild_members from public, anon, authenticated;
grant all on public.guild_members to service_role;

alter table public.guild_builds enable row level security;
revoke all on public.guild_builds from public, anon, authenticated;
grant all on public.guild_builds to service_role;

alter table public.member_builds enable row level security;
revoke all on public.member_builds from public, anon, authenticated;
grant all on public.member_builds to service_role;

alter table public.guild_rules enable row level security;
revoke all on public.guild_rules from public, anon, authenticated;
grant all on public.guild_rules to service_role;

alter table public.guild_guides enable row level security;
revoke all on public.guild_guides from public, anon, authenticated;
grant all on public.guild_guides to service_role;

alter table public.guild_activities enable row level security;
revoke all on public.guild_activities from public, anon, authenticated;
grant all on public.guild_activities to service_role;

alter table public.guild_bank_transactions enable row level security;
revoke all on public.guild_bank_transactions from public, anon, authenticated;
grant all on public.guild_bank_transactions to service_role;

revoke all on function public.set_guild_updated_at() from public, anon, authenticated;
grant execute on function public.set_guild_updated_at() to service_role;

commit;
