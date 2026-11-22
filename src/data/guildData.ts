import { FunctionsHttpError } from '@supabase/supabase-js'
import type { MemberBuild } from './equipment'
import { readAuthSession } from './authStorage'
import { supabase } from './supabase'

export type GuildMemberRecord = {
  id: string
  name: string
  role: 'Guild Master' | 'Officer' | 'Veteran' | 'Member'
  specialty: string
  fame: string
  last_active: string
  online: boolean
  avatar: string
  avatar_tone: 'ember' | 'violet' | 'blue' | 'sage' | 'gold' | 'rose'
  created_at: string
  updated_at: string
}

export type GuildBuild = {
  id: string
  owner_id: string | null
  name: string
  role: string
  style: 'PvP' | 'ZvZ' | 'PvE' | 'Gathering'
  description: string
  specialty: string
  build: MemberBuild
  created_at: string
  updated_at: string
}

export type GuildRule = {
  id: string
  title: string
  category: string
  description: string
  created_at: string
  updated_at: string
}

export type GuildGuide = {
  id: string
  title: string
  category: string
  summary: string
  content: string
  created_at: string
  updated_at: string
}

export type GuildActivity = {
  id: string
  title: string
  category: string
  description: string
  location: string
  starts_at: string | null
  created_at: string
  updated_at: string
}

export type GuildBankTransaction = {
  id: string
  member_id: string
  type: 'Deposit' | 'Withdraw'
  amount: number
  note: string
  created_at: string
  member: { name: string } | null
}

export type MemberBuildRecord = {
  member_id: string
  build: MemberBuild
  updated_at: string
}

export type GuildDataTable =
  | 'guild_members'
  | 'guild_builds'
  | 'member_builds'
  | 'guild_rules'
  | 'guild_guides'
  | 'guild_activities'
  | 'guild_bank_transactions'

export type GuildDataRecord = GuildMemberRecord | GuildBuild | MemberBuildRecord |
  GuildRule | GuildGuide | GuildActivity | GuildBankTransaction

type GuildDataResponse = {
  records?: unknown
  record?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function requestGuildData(
  action: 'read' | 'create' | 'update' | 'delete',
  table: GuildDataTable,
  values: { id?: string; record?: Record<string, unknown> } = {},
): Promise<GuildDataResponse> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const sessionToken = readAuthSession()
  if (!sessionToken) throw new Error('Your sign-in session is missing. Please sign in again.')

  const { data, error } = await supabase.functions.invoke<GuildDataResponse>('guild-data', {
    body: { action, table, sessionToken, ...values },
  })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      let responseBody: unknown
      try {
        responseBody = await error.context.json()
      } catch {
        responseBody = null
      }
      if (isRecord(responseBody) && typeof responseBody.error === 'string') {
        throw new Error(responseBody.error)
      }
    }
    throw new Error(error.message)
  }
  if (!data || !isRecord(data)) throw new Error('The guild data service returned an invalid response.')
  return data
}

export async function listGuildRecords<T extends GuildDataRecord>(
  table: GuildDataTable,
): Promise<T[]> {
  const data = await requestGuildData('read', table)
  if (!Array.isArray(data.records) || !data.records.every(isRecord)) {
    throw new Error('The guild data service returned an invalid record list.')
  }
  return data.records as T[]
}

export async function createGuildRecord<T extends GuildDataRecord>(
  table: GuildDataTable,
  record: Record<string, unknown>,
): Promise<T> {
  const data = await requestGuildData('create', table, { record })
  if (!isRecord(data.record)) throw new Error('The guild data service returned an invalid record.')
  return data.record as T
}

export async function updateGuildRecord<T extends GuildDataRecord>(
  table: GuildDataTable,
  id: string,
  record: Record<string, unknown>,
): Promise<T> {
  const data = await requestGuildData('update', table, { id, record })
  if (!isRecord(data.record)) throw new Error('The guild data service returned an invalid record.')
  return data.record as T
}

export async function deleteGuildRecord(
  table: GuildDataTable,
  id: string,
): Promise<void> {
  await requestGuildData('delete', table, { id })
}
