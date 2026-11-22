create or replace function public.check_game_name_auth_rate_limit(
  p_key text,
  p_max_attempts integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_attempt_count integer;
begin
  insert into public.game_name_auth_rate_limits as limits (key, window_started_at, attempt_count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set window_started_at = case
          when limits.window_started_at <= now() - interval '15 minutes' then now()
          else limits.window_started_at
        end,
        attempt_count = case
          when limits.window_started_at <= now() - interval '15 minutes' then 1
          else limits.attempt_count + 1
        end
  returning attempt_count into current_attempt_count;

  delete from public.game_name_auth_rate_limits
    where window_started_at < now() - interval '1 day';

  return current_attempt_count <= p_max_attempts;
end;
$$;

revoke all on function public.check_game_name_auth_rate_limit(text, integer) from public, anon, authenticated;
grant execute on function public.check_game_name_auth_rate_limit(text, integer) to service_role;
