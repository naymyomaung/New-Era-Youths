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
