export type AuthUser = {
  id: string
  gameName: string
  totalFame: number
  currentSilver: number
  currentSet: string
  guildCode: string
  role: 'Guild Master' | 'Officer' | 'Veteran' | 'Member'
}

const sessionStorageKey = 'new-era-youths:custom-auth-session:v1'
const allowedRoles: AuthUser['role'][] = ['Guild Master', 'Officer', 'Veteran', 'Member']

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export function toAuthUser(value: unknown): AuthUser | null {
  if (typeof value !== 'object' || value === null) return null
  const user = value as Record<string, unknown>
  const totalFame = numberValue(user.total_fame)
  const currentSilver = numberValue(user.current_silver)
  const role = allowedRoles.find((allowedRole) => allowedRole === user.role)
  if (
    typeof user.id !== 'string' ||
    typeof user.game_name !== 'string' ||
    totalFame === null ||
    currentSilver === null ||
    typeof user.current_set !== 'string' ||
    typeof user.guild_code !== 'string' ||
    !role
  ) {
    return null
  }
  return {
    id: user.id,
    gameName: user.game_name,
    totalFame,
    currentSilver,
    currentSet: user.current_set,
    guildCode: user.guild_code,
    role,
  }
}

export function readAuthSession() {
  return window.sessionStorage.getItem(sessionStorageKey)
}

export function saveAuthSession(token: string) {
  window.sessionStorage.setItem(sessionStorageKey, token)
}

export function clearAuthSession() {
  window.sessionStorage.removeItem(sessionStorageKey)
}
