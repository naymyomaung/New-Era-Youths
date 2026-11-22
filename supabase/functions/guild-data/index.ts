import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const tableNames = [
  'guild_members',
  'guild_builds',
  'member_builds',
  'guild_rules',
  'guild_guides',
  'guild_activities',
  'guild_bank_transactions',
] as const
type TableName = typeof tableNames[number]
type JsonRecord = Record<string, unknown>

type DataRequest = {
  action?: unknown
  table?: unknown
  id?: unknown
  record?: unknown
  sessionToken?: unknown
}

const allowedFields: Record<TableName, string[]> = {
  guild_members: ['name', 'role', 'specialty', 'fame', 'last_active', 'online', 'avatar', 'avatar_tone'],
  guild_builds: ['name', 'role', 'style', 'description', 'specialty', 'build'],
  member_builds: ['member_id', 'build'],
  guild_rules: ['title', 'category', 'description'],
  guild_guides: ['title', 'category', 'summary', 'content'],
  guild_activities: ['title', 'category', 'description', 'location', 'starts_at'],
  guild_bank_transactions: ['member_id', 'type', 'amount', 'note'],
}

const selfEditableMemberFields = ['specialty', 'fame', 'last_active', 'online', 'avatar', 'avatar_tone']

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

function normalizeGameName(value: string) {
  return value.normalize('NFKC').trim().toLocaleLowerCase('en-US')
}

async function checkBuildOwner(
  admin: ReturnType<typeof createClient>,
  buildId: string,
  userId: string,
) {
  const { data: build, error } = await admin
    .from('guild_builds')
    .select('owner_id')
    .eq('id', buildId)
    .maybeSingle()
  if (error) {
    console.error('Unable to verify build ownership.', error)
    return respond(503, { error: 'Unable to verify build ownership. Please try again.' })
  }
  if (!build) return respond(404, { error: 'Build not found.' })
  if (build.owner_id !== userId) {
    return respond(403, { error: 'Only the account that created this build can edit or delete it.' })
  }
  return null
}

async function findOwnRosterMemberId(
  admin: ReturnType<typeof createClient>,
  gameNameKey: string,
) {
  const { data: roster, error } = await admin.from('guild_members').select('id, name')
  if (error) {
    console.error('Unable to match the signed-in account to the guild roster.', error)
    return {
      memberId: null,
      response: respond(503, { error: 'Unable to verify your guild profile. Please try again.' }),
    }
  }

  const matchingMembers = roster.filter((member) => normalizeGameName(member.name) === gameNameKey)
  if (matchingMembers.length > 1) {
    console.error('Multiple guild roster entries match the signed-in game name.')
    return {
      memberId: null,
      response: respond(409, { error: 'Your game name matches more than one roster entry. Ask an Officer to correct the roster.' }),
    }
  }

  return { memberId: matchingMembers[0]?.id ?? null, response: null }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isBoundedString(value: unknown, maxLength: number, minLength = 0): value is string {
  return typeof value === 'string' && value.trim().length >= minLength && value.length <= maxLength
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function isBuild(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.gear) || !Array.isArray(value.skills)) return false
  const validSlots = ['Bag', 'Main hand', 'Off hand', 'Head', 'Armor', 'Shoes', 'Mount', 'Cape', 'Food', 'Potion']
  const validKeys = ['Q', 'W', 'E', 'Passive']
  return value.gear.length <= 10 && value.skills.length <= 32 &&
    value.gear.every((item) =>
      isRecord(item) &&
      validSlots.includes(String(item.slot)) &&
      isBoundedString(item.name, 100) &&
      (item.itemId === null || isBoundedString(item.itemId, 100)) &&
      typeof item.tier === 'number' && Number.isInteger(item.tier) && item.tier >= 0 && item.tier <= 8,
    ) &&
    value.skills.every((skill) =>
      isRecord(skill) &&
      isBoundedString(skill.id, 100, 1) &&
      validKeys.includes(String(skill.key)) &&
      isBoundedString(skill.name, 100, 1),
    )
}

function validateRecord(table: TableName, value: unknown): JsonRecord | null {
  if (!isRecord(value)) return null
  if (Object.keys(value).some((key) => !allowedFields[table].includes(key))) return null

  switch (table) {
    case 'guild_members':
      return isBoundedString(value.name, 50, 1) &&
          ['Guild Master', 'Officer', 'Veteran', 'Member'].includes(String(value.role)) &&
          isBoundedString(value.specialty, 120) &&
          isBoundedString(value.fame, 40, 1) &&
          isBoundedString(value.last_active, 80, 1) &&
          typeof value.online === 'boolean' &&
          isBoundedString(value.avatar, 4, 1) &&
          ['ember', 'violet', 'blue', 'sage', 'gold', 'rose'].includes(String(value.avatar_tone))
        ? value
        : null
    case 'guild_builds':
      return isBoundedString(value.name, 100, 1) &&
          isBoundedString(value.role, 50, 1) &&
          ['PvP', 'ZvZ', 'PvE', 'Gathering'].includes(String(value.style)) &&
          isBoundedString(value.description, 1000) &&
          isBoundedString(value.specialty, 120) &&
          isBuild(value.build)
        ? value
        : null
    case 'member_builds':
      return isUuid(value.member_id) && isBuild(value.build) ? value : null
    case 'guild_rules':
      return isBoundedString(value.title, 100, 1) &&
          isBoundedString(value.category, 80, 1) &&
          isBoundedString(value.description, 2000, 1)
        ? value
        : null
    case 'guild_guides':
      return isBoundedString(value.title, 150, 1) &&
          isBoundedString(value.category, 80, 1) &&
          isBoundedString(value.summary, 500, 1) &&
          isBoundedString(value.content, 20000, 1)
        ? value
        : null
    case 'guild_activities':
      return isBoundedString(value.title, 150, 1) &&
          isBoundedString(value.category, 80, 1) &&
          isBoundedString(value.description, 2000) &&
          isBoundedString(value.location, 150) &&
          (value.starts_at === null ||
            (isBoundedString(value.starts_at, 40, 1) && Number.isFinite(Date.parse(value.starts_at))))
        ? value
        : null
    case 'guild_bank_transactions':
      return isUuid(value.member_id) &&
          ['Deposit', 'Withdraw'].includes(String(value.type)) &&
          typeof value.amount === 'number' &&
          Number.isSafeInteger(value.amount) && value.amount > 0 &&
          isBoundedString(value.note, 500)
        ? value
        : null
  }
}

async function digest(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function handleRequest(request: Request) {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return respond(405, { error: 'Method not allowed.' })

  let body: DataRequest
  try {
    body = await request.json() as DataRequest
  } catch {
    return respond(400, { error: 'Invalid request body.' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Required guild data function environment variables are missing.')
    return respond(500, { error: 'The guild data service is not configured.' })
  }

  if (typeof body.sessionToken !== 'string' || !/^[0-9a-f]{64}$/.test(body.sessionToken)) {
    return respond(401, { error: 'Your sign-in session is invalid. Please sign in again.' })
  }
  if (typeof body.action !== 'string' || !['read', 'create', 'update', 'delete'].includes(body.action)) {
    return respond(400, { error: 'Invalid data action.' })
  }
  if (typeof body.table !== 'string' || !tableNames.includes(body.table as TableName)) {
    return respond(400, { error: 'Invalid data table.' })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const tokenHash = await digest(body.sessionToken)
  const { data: session, error: sessionError } = await admin
    .from('auth_sessions')
    .select('user_id, expires_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()
  if (sessionError) {
    console.error('Unable to validate a guild data session.', sessionError)
    return respond(503, { error: 'Unable to validate your session. Please try again.' })
  }
  if (!session || Date.parse(session.expires_at) <= Date.now()) {
    return respond(401, { error: 'Your sign-in session expired. Please sign in again.' })
  }

  const { data: user, error: userError } = await admin
    .from('authuser')
    .select('id, role, game_name_key')
    .eq('id', session.user_id)
    .maybeSingle()
  if (userError || !user) {
    console.error('Unable to load the account for a guild data session.', userError)
    return respond(503, { error: 'Unable to verify your account. Please try again.' })
  }

  const action = body.action
  const table = body.table as TableName
  const isRosterManager = user.role === 'Guild Master' || user.role === 'Officer'
  const isGuildMaster = user.role === 'Guild Master'
  let ownMemberId: string | null = null
  if (
    action !== 'read' &&
    (table === 'member_builds' || (table === 'guild_members' && action === 'update' && !isGuildMaster))
  ) {
    const ownMember = await findOwnRosterMemberId(admin, user.game_name_key)
    if (ownMember.response) return ownMember.response
    ownMemberId = ownMember.memberId
  }

  if (table === 'guild_bank_transactions' && action !== 'read') {
    const record = action === 'delete' ? null : validateRecord(table, body.record)
    if (action !== 'delete' && !record) return respond(400, { error: 'Invalid transaction details.' })
    if (action === 'delete' && !isUuid(body.id)) return respond(400, { error: 'Invalid transaction ID.' })
    if ((action === 'update' || action === 'delete') && !isUuid(body.id)) {
      return respond(400, { error: 'Invalid transaction ID.' })
    }

    const { data, error } = await admin.rpc('mutate_guild_bank_transaction', {
      p_action: action,
      p_id: body.id ?? null,
      p_member_id: record?.member_id ?? null,
      p_type: record?.type ?? null,
      p_amount: record?.amount ?? null,
      p_note: record?.note ?? '',
      p_owner_member_id: null,
    })
    if (error) {
      if (error.code === '42501') return respond(403, { error: error.message })
      if (error.code === '23514' || error.code === '23503' || error.code === 'P0002') {
        return respond(409, { error: error.message })
      }
      console.error('Unable to change a guild bank transaction.', error)
      return respond(503, { error: 'Unable to save the bank transaction. Please try again.' })
    }
    if (!isRecord(data) || !isUuid(data.member_id)) {
      console.error('The bank transaction function returned an invalid record.')
      return respond(503, { error: 'The saved transaction could not be loaded. Please refresh and try again.' })
    }
    const { data: member, error: memberError } = await admin
      .from('guild_members')
      .select('name')
      .eq('id', data.member_id)
      .maybeSingle()
    if (memberError) console.error('Unable to load the member name for a bank transaction.', memberError)
    return respond(200, { record: { ...data, member: member ?? null } })
  }

  if (action === 'read') {
    const query = table === 'guild_bank_transactions'
      ? admin.from(table).select('*, member:guild_members(name)').order('created_at', { ascending: false })
      : table === 'member_builds'
        ? admin.from(table).select('*').order('updated_at', { ascending: false })
        : table === 'guild_activities'
          ? admin.from(table).select('*').order('starts_at', { ascending: true, nullsFirst: false })
          : admin.from(table).select('*').order('created_at', { ascending: false })
    const { data, error } = await query
    if (error) {
      console.error(`Unable to read ${table}.`, error)
      return respond(503, { error: 'Unable to load guild data. Please try again.' })
    }
    return respond(200, { records: data })
  }

  if (action === 'delete') {
    if (!isUuid(body.id)) return respond(400, { error: 'Invalid record ID.' })
    if (table === 'guild_members' && !isGuildMaster) {
      return respond(403, { error: 'Only the Guild Master can delete roster members.' })
    }
    if (table === 'member_builds' && (!ownMemberId || body.id !== ownMemberId)) {
      return respond(403, { error: 'You can only change the loadout for your own roster profile.' })
    }
    if (table === 'guild_builds') {
      const ownerError = await checkBuildOwner(admin, body.id, user.id)
      if (ownerError) return ownerError
    }
    const key = table === 'member_builds' ? 'member_id' : 'id'
    let deleteQuery = admin.from(table).delete().eq(key, body.id)
    if (table === 'guild_builds') deleteQuery = deleteQuery.eq('owner_id', user.id)
    const { data, error } = await deleteQuery.select(key).maybeSingle()
    if (error) {
      if (error.code === '23503') return respond(409, { error: 'This record is still in use and cannot be deleted.' })
      console.error(`Unable to delete from ${table}.`, error)
      return respond(503, { error: 'Unable to delete this record. Please try again.' })
    }
    if (!data) return respond(404, { error: 'Record not found.' })
    return respond(200, { ok: true })
  }

  if (table === 'guild_members' && action === 'update') {
    if (!isUuid(body.id)) return respond(400, { error: 'Invalid member ID.' })
    if (!isRecord(body.record)) return respond(400, { error: 'Invalid member details.' })

    const submittedFields = Object.keys(body.record)
    if (isGuildMaster) {
      if (submittedFields.length !== 1 || submittedFields[0] !== 'role') {
        return respond(403, { error: 'The Guild Master can only edit member roles.' })
      }
      if (!['Guild Master', 'Officer', 'Veteran', 'Member'].includes(String(body.record.role))) {
        return respond(400, { error: 'Invalid guild role.' })
      }
    } else {
      if (!ownMemberId || body.id !== ownMemberId) {
        return respond(403, { error: 'You can only edit your own roster profile.' })
      }
      if (submittedFields.length === 0 || submittedFields.some((field) => !selfEditableMemberFields.includes(field))) {
        return respond(403, { error: 'You can edit your own profile details, but not your name or role.' })
      }
    }

    const { data: target, error: targetError } = await admin
      .from('guild_members')
      .select('id, name, role, specialty, fame, last_active, online, avatar, avatar_tone')
      .eq('id', body.id)
      .maybeSingle()
    if (targetError) {
      console.error('Unable to load the roster member for editing.', targetError)
      return respond(503, { error: 'Unable to load this roster member. Please try again.' })
    }
    if (!target) return respond(404, { error: 'Roster member not found.' })

    if (isGuildMaster) {
      const { data: linkedAccount, error: linkedAccountError } = await admin
        .from('authuser')
        .select('id')
        .eq('game_name_key', normalizeGameName(target.name))
        .maybeSingle()
      if (linkedAccountError) {
        console.error('Unable to find the account linked to the roster member.', linkedAccountError)
        return respond(503, { error: 'Unable to update the linked account role. Please try again.' })
      }
      const { data, error } = await admin.rpc('mutate_guild_member_role', {
        p_member_id: body.id,
        p_role: body.record.role,
        p_auth_user_id: linkedAccount?.id ?? null,
      })
      if (error) {
        if (error.code === 'P0002') return respond(404, { error: error.message })
        if (error.code === '23514') return respond(400, { error: error.message })
        console.error('Unable to update a guild member role.', error)
        return respond(503, { error: 'Unable to update this member role. Please try again.' })
      }
      if (!isRecord(data) || !isUuid(data.id)) {
        console.error('The member role function returned an invalid record.')
        return respond(503, { error: 'The updated member could not be loaded. Please refresh and try again.' })
      }
      return respond(200, { record: data })
    }

    const record = {
      name: target.name,
      role: target.role,
      specialty: body.record.specialty ?? target.specialty,
      fame: body.record.fame ?? target.fame,
      last_active: body.record.last_active ?? target.last_active,
      online: body.record.online ?? target.online,
      avatar: body.record.avatar ?? target.avatar,
      avatar_tone: body.record.avatar_tone ?? target.avatar_tone,
    }
    if (!validateRecord('guild_members', record)) {
      return respond(400, { error: 'Invalid member profile details.' })
    }

    const { data, error } = await admin
      .from('guild_members')
      .update(body.record)
      .eq('id', body.id)
      .select('*')
      .maybeSingle()
    if (error) {
      console.error('Unable to update the signed-in member profile.', error)
      return respond(503, { error: 'Unable to save your member profile. Please try again.' })
    }
    if (!data) return respond(404, { error: 'Roster member not found.' })
    return respond(200, { record: data })
  }

  if (table === 'guild_members' && action === 'create' && !isRosterManager) {
    return respond(403, { error: 'Only Guild Masters and Officers can add roster members.' })
  }

  if (table === 'member_builds' && action === 'update' && body.id !== ownMemberId) {
    return respond(403, { error: 'You can only edit the loadout for your own roster profile.' })
  }

  if (table === 'guild_members' && action === 'update') {
    if (!isUuid(body.id)) return respond(400, { error: 'Invalid member ID.' })
    if (!isRecord(body.record)) return respond(400, { error: 'Invalid member details.' })

    const submittedFields = Object.keys(body.record)
    if (isGuildMaster) {
      if (submittedFields.length !== 1 || submittedFields[0] !== 'role') {
        return respond(403, { error: 'The Guild Master can only edit member roles.' })
      }
      if (!['Guild Master', 'Officer', 'Veteran', 'Member'].includes(String(body.record.role))) {
        return respond(400, { error: 'Invalid guild role.' })
      }
    } else {
      if (body.id !== ownMemberId) {
        return respond(403, { error: 'You can only edit your own roster profile.' })
      }
      if (submittedFields.length === 0 || submittedFields.some((field) => !selfEditableMemberFields.includes(field))) {
        return respond(403, { error: 'You can edit your own profile details, but not your name or role.' })
      }
    }

    const { data: target, error: targetError } = await admin
      .from('guild_members')
      .select('id, name, role, specialty, fame, last_active, online, avatar, avatar_tone')
      .eq('id', body.id)
      .maybeSingle()
    if (targetError) {
      console.error('Unable to load the roster member for editing.', targetError)
      return respond(503, { error: 'Unable to load this roster member. Please try again.' })
    }
    if (!target) return respond(404, { error: 'Roster member not found.' })

    if (isGuildMaster) {
      const { data: linkedAccount, error: linkedAccountError } = await admin
        .from('authuser')
        .select('id')
        .eq('game_name_key', normalizeGameName(target.name))
        .maybeSingle()
      if (linkedAccountError) {
        console.error('Unable to find the account linked to the roster member.', linkedAccountError)
        return respond(503, { error: 'Unable to update the linked account role. Please try again.' })
      }
      const { data, error } = await admin.rpc('mutate_guild_member_role', {
        p_member_id: body.id,
        p_role: body.record.role,
        p_auth_user_id: linkedAccount?.id ?? null,
      })
      if (error) {
        if (error.code === 'P0002') return respond(404, { error: error.message })
        if (error.code === '23514') return respond(400, { error: error.message })
        console.error('Unable to update a guild member role.', error)
        return respond(503, { error: 'Unable to update this member role. Please try again.' })
      }
      if (!isRecord(data) || !isUuid(data.id)) {
        console.error('The member role function returned an invalid record.')
        return respond(503, { error: 'The updated member could not be loaded. Please refresh and try again.' })
      }
      return respond(200, { record: data })
    }

    const record = {
      name: target.name,
      role: target.role,
      specialty: body.record.specialty ?? target.specialty,
      fame: body.record.fame ?? target.fame,
      last_active: body.record.last_active ?? target.last_active,
      online: body.record.online ?? target.online,
      avatar: body.record.avatar ?? target.avatar,
      avatar_tone: body.record.avatar_tone ?? target.avatar_tone,
    }
    if (!validateRecord('guild_members', record)) {
      return respond(400, { error: 'Invalid member profile details.' })
    }

    const { data, error } = await admin
      .from('guild_members')
      .update(body.record)
      .eq('id', body.id)
      .select('*')
      .maybeSingle()
    if (error) {
      console.error('Unable to update the signed-in member profile.', error)
      return respond(503, { error: 'Unable to save your member profile. Please try again.' })
    }
    if (!data) return respond(404, { error: 'Roster member not found.' })
    return respond(200, { record: data })
  }

  if (table === 'guild_members' && action === 'create' && !isRosterManager) {
    return respond(403, { error: 'Only Guild Masters and Officers can add roster members.' })
  }

  if (table === 'member_builds' && action !== 'read' && !ownMemberId) {
    return respond(403, { error: 'Your account must match a roster member to edit that member loadout.' })
  }

  const record = validateRecord(table, body.record)
  if (!record) return respond(400, { error: 'Invalid record details.' })

  if (table === 'member_builds' && record.member_id !== ownMemberId) {
    return respond(403, { error: 'You can only edit the loadout for your own roster profile.' })
  }

  if (table === 'guild_builds' && action === 'create') record.owner_id = user.id
  if (table === 'guild_builds' && action === 'update') {
    if (!isUuid(body.id)) return respond(400, { error: 'Invalid build ID.' })
    const ownerError = await checkBuildOwner(admin, body.id, user.id)
    if (ownerError) return ownerError
  }

  const result = action === 'create'
    ? table === 'member_builds'
      ? await admin.from(table).upsert(record).select('*').single()
      : await admin.from(table).insert(record).select('*').single()
    : isUuid(body.id)
      ? table === 'member_builds'
        ? await admin.from(table).upsert(record).select('*').single()
        : table === 'guild_builds'
          ? await admin.from(table).update(record).eq('id', body.id).eq('owner_id', user.id).select('*').maybeSingle()
          : await admin.from(table).update(record).eq('id', body.id).select('*').maybeSingle()
      : null

  if (!result) return respond(400, { error: 'Invalid record ID.' })
  if (result.error) {
    if (result.error.code === '23505') return respond(409, { error: 'A record with that name already exists.' })
    console.error(`Unable to save ${table}.`, result.error)
    return respond(503, { error: 'Unable to save this record. Please try again.' })
  }
  if (!result.data) return respond(404, { error: 'Record not found.' })
  return respond(200, { record: result.data })
}

Deno.serve(async (request: Request) => {
  try {
    return await handleRequest(request)
  } catch (error) {
    console.error('Unexpected guild data request failure.', error)
    return respond(500, { error: 'An unexpected guild data error occurred.' })
  }
})
