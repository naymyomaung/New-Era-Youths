begin;

drop function if exists public.mutate_guild_bank_transaction(text, uuid, uuid, text, bigint, text);

create or replace function public.mutate_guild_bank_transaction(
  p_action text,
  p_id uuid default null,
  p_member_id uuid default null,
  p_type text default null,
  p_amount bigint default null,
  p_note text default '',
  p_owner_member_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_transaction public.guild_bank_transactions%rowtype;
  resulting_balance bigint;
begin
  perform pg_advisory_xact_lock(hashtext('guild-bank-ledger'));

  if p_action = 'delete' then
    select * into current_transaction
      from public.guild_bank_transactions
      where id = p_id
      for update;
    if not found then
      raise exception 'Transaction not found.' using errcode = 'P0002';
    end if;
    if p_owner_member_id is not null and current_transaction.member_id <> p_owner_member_id then
      raise exception 'You can only manage transactions for your own guild character.' using errcode = '42501';
    end if;

    select coalesce(sum(case when type = 'Deposit' then amount else -amount end), 0)
      into resulting_balance
      from public.guild_bank_transactions
      where id <> p_id;
    if resulting_balance < 0 then
      raise exception 'Deleting this transaction would make the bank balance negative.' using errcode = '23514';
    end if;

    delete from public.guild_bank_transactions where id = p_id;
    return to_jsonb(current_transaction);
  end if;

  if p_action not in ('create', 'update') then
    raise exception 'Invalid transaction action.' using errcode = '22023';
  end if;
  if p_member_id is null or p_type is null or p_type not in ('Deposit', 'Withdraw') or p_amount is null or p_amount <= 0 then
    raise exception 'Invalid transaction details.' using errcode = '22023';
  end if;
  if p_action = 'create' and p_owner_member_id is not null and p_member_id <> p_owner_member_id then
    raise exception 'You can only create transactions for your own guild character.' using errcode = '42501';
  end if;

  if p_action = 'update' then
    select * into current_transaction
      from public.guild_bank_transactions
      where id = p_id
      for update;
    if not found then
      raise exception 'Transaction not found.' using errcode = 'P0002';
    end if;
    if p_owner_member_id is not null and current_transaction.member_id <> p_owner_member_id then
      raise exception 'You can only manage transactions for your own guild character.' using errcode = '42501';
    end if;
    if p_owner_member_id is not null and p_member_id <> p_owner_member_id then
      raise exception 'You can only assign transactions to your own guild character.' using errcode = '42501';
    end if;
  end if;

  select coalesce(sum(case when type = 'Deposit' then amount else -amount end), 0)
    into resulting_balance
    from public.guild_bank_transactions
    where p_action <> 'update' or id <> p_id;

  resulting_balance := resulting_balance +
    case when p_type = 'Deposit' then p_amount else -p_amount end;
  if resulting_balance < 0 then
    raise exception 'The guild bank does not have enough silver for this withdrawal.' using errcode = '23514';
  end if;

  if p_action = 'create' then
    insert into public.guild_bank_transactions (member_id, type, amount, note)
      values (p_member_id, p_type, p_amount, coalesce(p_note, ''))
      returning * into current_transaction;
  else
    update public.guild_bank_transactions
      set member_id = p_member_id,
          type = p_type,
          amount = p_amount,
          note = coalesce(p_note, '')
      where id = p_id
      returning * into current_transaction;
  end if;

  return to_jsonb(current_transaction);
end;
$$;

revoke all on function public.mutate_guild_bank_transaction(text, uuid, uuid, text, bigint, text, uuid)
  from public, anon, authenticated;
grant execute on function public.mutate_guild_bank_transaction(text, uuid, uuid, text, bigint, text, uuid)
  to service_role;

commit;
