import { useState, type FormEvent } from 'react'
import type { GuildMemberRecord } from '../data/guildData'
import { Icon } from './Icon'

const avatarTones = ['gold', 'violet', 'ember', 'blue', 'sage', 'rose'] as const

export function GuildMemberDialog({
  member,
  canEditProfile,
  canEditRole,
  onClose,
  onSave,
}: {
  member: GuildMemberRecord | null
  canEditProfile: boolean
  canEditRole: boolean
  onClose: () => void
  onSave: (values: Record<string, unknown>) => Promise<void>
}) {
  const [name, setName] = useState(member?.name ?? '')
  const [role, setRole] = useState(member?.role ?? 'Member')
  const [specialty, setSpecialty] = useState(member?.specialty ?? '')
  const [fame, setFame] = useState(member?.fame ?? '0')
  const [lastActive, setLastActive] = useState(member?.last_active ?? 'New member')
  const [online, setOnline] = useState(member?.online ?? false)
  const [avatarTone, setAvatarTone] = useState<GuildMemberRecord['avatar_tone']>(member?.avatar_tone ?? 'gold')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const canEditProfileFields = !member || canEditProfile
  const canEditRoleField = !member || canEditRole

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      const values = member
        ? {
          ...(canEditRoleField ? { role } : {}),
          ...(canEditProfileFields
            ? {
              specialty: specialty.trim(),
              fame: fame.trim(),
              last_active: online ? 'Online now' : lastActive.trim(),
              online,
              avatar: member.avatar,
              avatar_tone: avatarTone,
            }
            : {}),
        }
        : {
          name: name.trim(),
          role,
          specialty: specialty.trim(),
          fame: fame.trim(),
          last_active: online ? 'Online now' : lastActive.trim(),
          online,
          avatar: name.trim().slice(0, 2).toUpperCase(),
          avatar_tone: avatarTone,
        }
      await onSave(values)
      onClose()
    } catch (saveError) {
      console.error('Unable to save guild member.', saveError)
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this member.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="picker-backdrop" onMouseDown={onClose}>
      <section aria-labelledby="member-dialog-title" aria-modal="true" className="rule-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <div className="picker-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> GUILD ROSTER</div>
            <h2 id="member-dialog-title">{member ? canEditProfileFields ? 'Edit member' : 'Edit member role' : 'Add member'}</h2>
            <p>Manage a member profile in the guild roster.</p>
          </div>
          <button aria-label="Close dialog" className="picker-close" onClick={onClose} type="button"><Icon name="close" /></button>
        </div>
        <form className="rule-form" onSubmit={(event) => void submit(event)}>
          <label className="build-field"><span>In-game name</span><input autoFocus disabled={Boolean(member)} maxLength={50} onChange={(event) => setName(event.target.value)} required value={name} /></label>
          <label className="build-field">
            <span>Guild role</span>
            <select disabled={!canEditRoleField || isSaving} onChange={(event) => setRole(event.target.value as GuildMemberRecord['role'])} value={role}>
              <option>Guild Master</option><option>Officer</option><option>Veteran</option><option>Member</option>
            </select>
          </label>
          {canEditProfileFields && (
            <>
              <label className="build-field"><span>Specialty</span><input maxLength={120} onChange={(event) => setSpecialty(event.target.value)} value={specialty} /></label>
              <label className="build-field"><span>Fame</span><input maxLength={40} onChange={(event) => setFame(event.target.value)} required value={fame} /></label>
              <label className="build-field"><span>Last active</span><input disabled={online} maxLength={80} onChange={(event) => setLastActive(event.target.value)} required value={online ? 'Online now' : lastActive} /></label>
              <label className="build-field">
                <span>Avatar color</span>
                <select onChange={(event) => setAvatarTone(event.target.value as GuildMemberRecord['avatar_tone'])} value={avatarTone}>
                  {avatarTones.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
                </select>
              </label>
              <label className="crud-checkbox"><input checked={online} onChange={(event) => setOnline(event.target.checked)} type="checkbox" /> Online now</label>
            </>
          )}
          {error && <p className="crud-error" role="alert">{error}</p>}
          <div className="create-build-footer">
            <button className="build-cancel-button" onClick={onClose} type="button">Cancel</button>
            <button className="invite-button" disabled={isSaving} type="submit"><Icon name={member ? 'download' : 'plus'} /> {isSaving ? 'Saving…' : !member ? 'Add member' : canEditProfileFields ? 'Save member' : 'Update role'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
