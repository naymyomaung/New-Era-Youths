import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createGuildRecord,
  deleteGuildRecord,
  listGuildRecords,
  updateGuildRecord,
  type GuildDataRecord,
  type GuildDataTable,
} from './guildData'

function recordId(record: GuildDataRecord) {
  if ('member_id' in record && !('id' in record)) return record.member_id
  return 'id' in record ? record.id : ''
}

export function useGuildRecords<T extends GuildDataRecord>(
  table: GuildDataTable,
  enabled: boolean,
) {
  const [records, setRecords] = useState<T[]>([])
  const [error, setError] = useState('')
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const loadVersion = useRef(0)
  const queryKey = table

  useEffect(() => {
    if (!enabled) return
    let active = true
    const requestVersion = ++loadVersion.current

    void listGuildRecords<T>(table).then((loaded) => {
      if (!active || loadVersion.current !== requestVersion) return
      setRecords(loaded)
      setError('')
      setLoadedKey(queryKey)
    }).catch((loadError: unknown) => {
      if (!active || loadVersion.current !== requestVersion) return
      console.error(`Unable to load ${table}.`, loadError)
      setError(loadError instanceof Error ? loadError.message : 'Unable to load guild data.')
      setLoadedKey(queryKey)
    })

    return () => {
      active = false
    }
  }, [enabled, queryKey, table])

  const create = useCallback(async (record: Record<string, unknown>) => {
    const saved = await createGuildRecord<T>(table, record)
    loadVersion.current += 1
    setRecords((current) => [saved, ...current])
    setError('')
    setLoadedKey(table)
    return saved
  }, [table])

  const update = useCallback(async (id: string, record: Record<string, unknown>) => {
    const saved = await updateGuildRecord<T>(table, id, record)
    loadVersion.current += 1
    const savedId = recordId(saved)
    setRecords((current) => current.some((item) => recordId(item) === savedId)
      ? current.map((item) => recordId(item) === savedId ? saved : item)
      : [saved, ...current])
    setError('')
    setLoadedKey(table)
    return saved
  }, [table])

  const remove = useCallback(async (id: string) => {
    await deleteGuildRecord(table, id)
    loadVersion.current += 1
    setRecords((current) => current.filter((item) => recordId(item) !== id))
    setError('')
    setLoadedKey(table)
  }, [table])

  const isLoading = enabled && loadedKey !== queryKey
  return { records, setRecords, isLoading, error, create, update, remove }
}
