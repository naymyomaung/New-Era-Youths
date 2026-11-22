import { createClient } from 'npm:@supabase/supabase-js@2'

const PASSWORD_ITERATIONS = 600_000
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}
const publicUserFields = 'id, game_name, total_fame, current_silver, current_set, guild_code, role'

type AuthRequest = {
  action?: unknown
  gameName?: unknown
  password?: unknown
  sessionToken?: unknown
  profile?: {
    total_fame?: unknown
    current_silver?: unknown
    current_set?: unknown
    guild_code?: unknown
  }
}

type AuthUserRecord = {
  id: string
  game_name: string
  total_fame: number | string
  current_silver: number | string
  current_set: string
  guild_code: string
  role: 'Guild Master' | 'Officer' | 'Veteran' | 'Member'
  password_salt: string
  password_hash: string
}

type PublicAuthUserRecord = Pick<
  AuthUserRecord,
  'id' | 'game_name' | 'total_fame' | 'current_silver' | 'current_set' | 'guild_code' | 'role'
>

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

function toHex(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes
  return Array.from(view, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

function fromHex(value: string) {
  const bytes = new Uint8Array(value.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

function randomHex(byteLength: number) {
  return toHex(crypto.getRandomValues(new Uint8Array(byteLength)))
}

async function digest(value: string) {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
}

async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: fromHex(salt),
      iterations: PASSWORD_ITERATIONS,
    },
    key,
    256,
  )
  return toHex(bits)
}

function hashesMatch(actual: string, expected: string) {
  if (actual.length !== expected.length) return false
  let difference = 0
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index)
  }
  return difference === 0
}

function publicUser(user: PublicAuthUserRecord) {
  return {
    id: user.id,
    game_name: user.game_name,
    total_fame: Number(user.total_fame),
    current_silver: Number(user.current_silver),
    current_set: user.current_set,
    guild_code: user.guild_code,
    role: user.role,
  }
}

function normalizeGameName(value: string) {
  return value.normalize('NFKC').trim().toLocaleLowerCase('en-US')
}

function formatFame(value: number | string) {
  const fame = Number(value)
  return fame >= 1_000_000 ? `${(fame / 1_000_000).toFixed(1)}M` : String(fame)
}

async function syncGuildRosterMember(
  admin: ReturnType<typeof createClient>,
  user: PublicAuthUserRecord,
) {
  const { data: roster, error: rosterError } = await admin
    .from('guild_members')
    .select('id, name')
  if (rosterError) throw rosterError

  const matchingMembers = roster.filter(
    (member) => normalizeGameName(member.name) === normalizeGameName(user.game_name),
  )
  if (matchingMembers.length > 1) {
    throw new Error('Multiple roster entries match this account game name.')
  }

  if (matchingMembers.length === 1) {
    const { error } = await admin
      .from('guild_members')
      .update({ role: user.role })
      .eq('id', matchingMembers[0].id)
    if (error) throw error
    return
  }

  const { error } = await admin.from('guild_members').insert({
    name: user.game_name,
    role: user.role,
    specialty: '',
    fame: formatFame(user.total_fame),
    last_active: 'New member',
    online: false,
    avatar: user.game_name.slice(0, 2).toUpperCase(),
    avatar_tone: 'gold',
  })
  if (!error) return

  if (error.code === '23505') {
    const { data: latestRoster, error: latestRosterError } = await admin
      .from('guild_members')
      .select('id, name')
    if (latestRosterError) throw latestRosterError
    const concurrentMatch = latestRoster.filter(
      (member) => normalizeGameName(member.name) === normalizeGameName(user.game_name),
    )
    if (concurrentMatch.length === 1) {
      const { error: updateError } = await admin
        .from('guild_members')
        .update({ role: user.role })
        .eq('id', concurrentMatch[0].id)
      if (!updateError) return
      throw updateError
    }
  }
  throw error
}

async function enforceRateLimit(
  admin: ReturnType<typeof createClient>,
  request: Request,
  normalizedName: string,
) {
  const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const clientIp = forwardedIp || request.headers.get('cf-connecting-ip') || 'unknown'
  const [ipKey, identityKey] = await Promise.all([
    digest(`ip:${clientIp}`),
    digest(`identity:${normalizedName}`),
  ])
  const [ipLimit, identityLimit] = await Promise.all([
    admin.rpc('check_game_name_auth_rate_limit', { p_key: ipKey, p_max_attempts: 30 }),
    admin.rpc('check_game_name_auth_rate_limit', { p_key: identityKey, p_max_attempts: 5 }),
  ])
  if (ipLimit.error || identityLimit.error) {
    console.error('Unable to check authentication rate limits.', ipLimit.error ?? identityLimit.error)
    return 'unavailable'
  }
  return ipLimit.data && identityLimit.data ? 'allowed' : 'limited'
}

async function createSession(
  admin: ReturnType<typeof createClient>,
  userId: string,
) {
  const now = new Date()
  const { error: cleanupError } = await admin
    .from('auth_sessions')
    .delete()
    .lt('expires_at', now.toISOString())
  if (cleanupError) throw cleanupError

  const sessionToken = randomHex(32)
  const { error } = await admin.from('auth_sessions').insert({
    token_hash: await digest(sessionToken),
    user_id: userId,
    expires_at: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  })
  if (error) throw error
  return sessionToken
}

async function handleRequest(request: Request) {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return respond(405, { error: 'Method not allowed.' })

  let body: AuthRequest
  try {
    body = await request.json() as AuthRequest
  } catch {
    return respond(400, { error: 'Invalid request body.' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Required Supabase function environment variables are missing.')
    return respond(500, { error: 'The authentication service is not configured.' })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const action = body.action

  if (action === 'session' || action === 'sign-out') {
    const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken : ''
    if (!/^[0-9a-f]{64}$/.test(sessionToken)) {
      return respond(401, { error: 'Your sign-in session is invalid. Please sign in again.' })
    }
    const tokenHash = await digest(sessionToken)
    if (action === 'sign-out') {
      const { error } = await admin.from('auth_sessions').delete().eq('token_hash', tokenHash)
      if (error) {
        console.error('Unable to revoke the authentication session.', error)
        return respond(503, { error: 'Unable to sign out. Please try again.' })
      }
      return respond(200, { ok: true })
    }

    const { data: session, error: sessionError } = await admin
      .from('auth_sessions')
      .select('user_id, expires_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()
    if (sessionError) {
      console.error('Unable to validate the authentication session.', sessionError)
      return respond(503, { error: 'Unable to validate your session. Please try again.' })
    }
    if (!session || Date.parse(session.expires_at) <= Date.now()) {
      if (session) {
        const { error } = await admin.from('auth_sessions').delete().eq('token_hash', tokenHash)
        if (error) console.error('Unable to remove an expired authentication session.', error)
      }
      return respond(401, { error: 'Your sign-in session expired. Please sign in again.' })
    }

    const { data: user, error: userError } = await admin
      .from('authuser')
      .select(publicUserFields)
      .eq('id', session.user_id)
      .maybeSingle()
    if (userError || !user) {
      console.error('Unable to load the account for an authenticated session.', userError)
      return respond(503, { error: 'Unable to load your account. Please try again.' })
    }
    try {
      await syncGuildRosterMember(admin, user as PublicAuthUserRecord)
    } catch (error) {
      console.error('Unable to sync the account to the guild roster.', error)
      return respond(503, { error: 'Unable to sync your account to the guild roster. Please try again.' })
    }
    return respond(200, { user })
  }

  if (action !== 'sign-in' && action !== 'sign-up') {
    return respond(400, { error: 'Invalid authentication action.' })
  }

  const gameName = typeof body.gameName === 'string' ? body.gameName.normalize('NFKC').trim() : ''
  const normalizedName = gameName.toLocaleLowerCase('en-US')
  const password = typeof body.password === 'string' ? body.password : ''
  if (!gameName || gameName.length > 50 || !password || password.length > 128) {
    return respond(400, { error: 'Enter a valid in-game name and password.' })
  }

  const rateLimit = await enforceRateLimit(admin, request, normalizedName)
  if (rateLimit === 'unavailable') {
    return respond(503, { error: 'The authentication service is temporarily unavailable.' })
  }
  if (rateLimit === 'limited') {
    return respond(429, { error: 'Too many attempts. Please wait 15 minutes and try again.' })
  }

  if (action === 'sign-up') {
    const profile = body.profile
    const totalFame = profile?.total_fame
    const currentSilver = profile?.current_silver
    if (
      typeof totalFame !== 'number' || !Number.isFinite(totalFame) || totalFame < 0 ||
      typeof currentSilver !== 'number' || !Number.isSafeInteger(currentSilver) || currentSilver < 0 ||
      typeof profile?.current_set !== 'string' || profile.current_set.length > 100 ||
      typeof profile.guild_code !== 'string' || profile.guild_code.length > 100 ||
      !passwordPattern.test(password)
    ) {
      return respond(400, { error: 'Enter valid profile details and a password with uppercase, lowercase, and a number (at least 8 characters).' })
    }

    const passwordSalt = randomHex(16)
    const passwordHash = await hashPassword(password, passwordSalt)
    const { data: user, error } = await admin
      .from('authuser')
      .insert({
        game_name: gameName,
        game_name_key: normalizedName,
        password_salt: passwordSalt,
        password_hash: passwordHash,
        total_fame: totalFame,
        current_silver: currentSilver,
        current_set: profile.current_set,
        guild_code: profile.guild_code.trim(),
      })
      .select(publicUserFields)
      .single()
    if (error || !user) {
      if (error?.code === '23505') {
        return respond(409, { error: 'An account with that in-game name already exists.' })
      }
      console.error('Unable to create the custom authentication account.', error)
      return respond(500, { error: 'Unable to create the account. Please try again.' })
    }

    try {
      const sessionToken = await createSession(admin, user.id)
      await syncGuildRosterMember(admin, user as PublicAuthUserRecord)
      return respond(200, { session_token: sessionToken, user: publicUser(user as PublicAuthUserRecord) })
    } catch (sessionError) {
      const { error: cleanupError } = await admin.from('authuser').delete().eq('id', user.id)
      if (cleanupError) console.error('Unable to clean up an account after signup failed.', cleanupError)
      console.error('Unable to finish creating the account and roster entry.', sessionError)
      return respond(503, { error: 'Unable to finish creating the account and roster entry. Please try again.' })
    }
  }

  const { data: user, error } = await admin
    .from('authuser')
    .select(`${publicUserFields}, password_salt, password_hash`)
    .eq('game_name_key', normalizedName)
    .maybeSingle()
  if (error) {
    console.error('Unable to look up the custom authentication account.', error)
    return respond(503, { error: 'The authentication service is temporarily unavailable.' })
  }
  if (!user) {
    await hashPassword(password, '00000000000000000000000000000000')
    return respond(401, { error: 'The in-game name or password is incorrect.' })
  }
  if (!hashesMatch(await hashPassword(password, user.password_salt), user.password_hash)) {
    return respond(401, { error: 'The in-game name or password is incorrect.' })
  }

  try {
    await syncGuildRosterMember(admin, user as PublicAuthUserRecord)
  } catch (error) {
    console.error('Unable to sync the account to the guild roster during sign-in.', error)
    return respond(503, { error: 'Unable to sync your account to the guild roster. Please try again.' })
  }

  try {
    const sessionToken = await createSession(admin, user.id)
    return respond(200, { session_token: sessionToken, user: publicUser(user as AuthUserRecord) })
  } catch (error) {
    console.error('Unable to create an authentication session.', error)
    return respond(503, { error: 'Unable to sign in right now. Please try again.' })
  }
}

Deno.serve(async (request: Request) => {
  try {
    return await handleRequest(request)
  } catch (error) {
    console.error('Unexpected custom authentication failure.', error)
    return respond(500, { error: 'An unexpected authentication error occurred.' })
  }
})
