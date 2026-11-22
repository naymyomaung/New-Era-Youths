create table if not exists public.authuser (
  id uuid primary key default gen_random_uuid(),
  game_name text not null check (length(trim(game_name)) between 1 and 50),
  game_name_key text not null unique,
  password_salt text not null,
  password_hash text not null,
  total_fame numeric not null default 0 check (total_fame >= 0),
  current_silver bigint not null default 0 check (current_silver >= 0),
  current_set text not null default 'Not selected',
  guild_code text not null default '',
  role text not null default 'Member' check (role in ('Guild Master', 'Officer', 'Veteran', 'Member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.auth_sessions (
  token_hash text primary key,
  user_id uuid not null references public.authuser (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists auth_sessions_user_id_idx
  on public.auth_sessions (user_id);
create index if not exists auth_sessions_expiry_idx
  on public.auth_sessions (expires_at);

create table if not exists public.game_name_auth_rate_limits (
  key text primary key,
  window_started_at timestamptz not null,
  attempt_count integer not null check (attempt_count > 0)
);

create index if not exists game_name_auth_rate_limits_window_idx
  on public.game_name_auth_rate_limits (window_started_at);
