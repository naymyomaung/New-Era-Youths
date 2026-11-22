begin;

create or replace function public.mutate_guild_member_role(
  p_member_id uuid,
  p_role text,
  p_auth_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_record public.guild_members%rowtype;
begin
  if p_role not in ('Guild Master', 'Officer', 'Veteran', 'Member') then
    raise exception 'Invalid guild role.' using errcode = '23514';
  end if;

  select *
    into member_record
    from public.guild_members
    where id = p_member_id
    for update;

  if not found then
    raise exception 'Guild member not found.' using errcode = 'P0002';
  end if;

  if p_auth_user_id is not null then
    update public.authuser
      set role = p_role
      where id = p_auth_user_id;

    if not found then
      raise exception 'Linked account not found.' using errcode = 'P0002';
    end if;
  end if;

  update public.guild_members
    set role = p_role
    where id = p_member_id
    returning * into member_record;

  return to_jsonb(member_record);
end;
$$;

revoke all on function public.mutate_guild_member_role(uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function public.mutate_guild_member_role(uuid, text, uuid)
  to service_role;

commit;
