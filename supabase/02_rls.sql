alter table public.authuser enable row level security;
revoke all on public.authuser from public, anon, authenticated;
grant all on public.authuser to service_role;

alter table public.auth_sessions enable row level security;
revoke all on public.auth_sessions from public, anon, authenticated;
grant all on public.auth_sessions to service_role;

alter table public.game_name_auth_rate_limits enable row level security;
revoke all on public.game_name_auth_rate_limits from public, anon, authenticated;
grant all on public.game_name_auth_rate_limits to service_role;
