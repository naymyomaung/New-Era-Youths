import { useState, type FormEvent } from 'react'
import { useGuildRecords } from '../data/useGuildRecords'
import type { GuildActivity } from '../data/guildData'
import { Icon } from './Icon'

function toLocalDateTime(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function formatActivityDate(value: string | null) {
  if (!value) return 'Date not set'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function GuildActivities({ canManage }: { canManage: boolean }) {
  const { records: activities, isLoading, error, create, update, remove } =
    useGuildRecords<GuildActivity>('guild_activities', true)
  const [editingActivity, setEditingActivity] = useState<GuildActivity | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Guild event')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const openDialog = (activity?: GuildActivity) => {
    setEditingActivity(activity ?? null)
    setTitle(activity?.title ?? '')
    setCategory(activity?.category ?? 'Guild event')
    setDescription(activity?.description ?? '')
    setLocation(activity?.location ?? '')
    setStartsAt(toLocalDateTime(activity?.starts_at ?? null))
    setFormError('')
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingActivity(null)
    setFormError('')
  }

  const saveActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = {
      title: title.trim(),
      category,
      description: description.trim(),
      location: location.trim(),
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
    }
    if (!values.title) {
      setFormError('Enter an activity title.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      if (editingActivity) await update(editingActivity.id, values)
      else await create(values)
      closeDialog()
    } catch (saveError) {
      console.error('Unable to save guild activity.', saveError)
      setFormError(saveError instanceof Error ? saveError.message : 'Unable to save this activity.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteActivity = async (activity: GuildActivity) => {
    if (!window.confirm(`Delete "${activity.title}"? This cannot be undone.`)) return
    setActionError('')
    try {
      await remove(activity.id)
    } catch (deleteError) {
      console.error('Unable to delete guild activity.', deleteError)
      setActionError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this activity.')
    }
  }

  return (
    <section className="guild-activities-page" aria-label="Guild activities">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> GUILD CALENDAR</div>
          <h1>Activities</h1>
          <p className="page-description">Plan and share upcoming New Era Youths activities.</p>
        </div>
        {canManage && <button className="invite-button" onClick={() => openDialog()} type="button"><Icon name="plus" /> Create activity</button>}
      </div>
      {isLoading && <p className="crud-status" role="status">Loading activities…</p>}
      {(error || actionError) && <p className="crud-error" role="alert">{error || actionError}</p>}
      {!isLoading && !error && (
        <div className="activity-list">
          {activities.map((activity) => (
            <article className="activity-record" key={activity.id}>
              <span className="activity-record-icon"><Icon name="activity" /></span>
              <div className="activity-record-copy">
                <div className="activity-record-meta">
                  <span className="build-style-badge pvp">{activity.category}</span>
                  <span>{formatActivityDate(activity.starts_at)}</span>
                </div>
                <h2>{activity.title}</h2>
                {activity.location && <p className="activity-record-location">{activity.location}</p>}
                {activity.description && <p>{activity.description}</p>}
              </div>
              {canManage && (
                <div className="crud-actions">
                  <button className="export-button" onClick={() => openDialog(activity)} type="button">Edit</button>
                  <button className="export-button danger-action" onClick={() => void deleteActivity(activity)} type="button">Delete</button>
                </div>
              )}
            </article>
          ))}
          {activities.length === 0 && <p className="crud-status">No activities yet.</p>}
        </div>
      )}

      {dialogOpen && (
        <div className="picker-backdrop" onMouseDown={closeDialog}>
          <section aria-labelledby="activity-dialog-title" aria-modal="true" className="rule-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <div className="picker-heading">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> GUILD CALENDAR</div>
                <h2 id="activity-dialog-title">{editingActivity ? 'Edit activity' : 'Create activity'}</h2>
                <p>Share the details with guild members.</p>
              </div>
              <button aria-label="Close dialog" className="picker-close" onClick={closeDialog} type="button"><Icon name="close" /></button>
            </div>
            <form className="rule-form" onSubmit={saveActivity}>
              <label className="build-field"><span>Activity title</span><input autoFocus onChange={(event) => setTitle(event.target.value)} required value={title} /></label>
              <label className="build-field">
                <span>Category</span>
                <select onChange={(event) => setCategory(event.target.value)} value={category}>
                  <option>Guild event</option><option>Group content</option><option>Gathering</option><option>Training</option><option>Other</option>
                </select>
              </label>
              <label className="build-field"><span>Date and time</span><input onChange={(event) => setStartsAt(event.target.value)} type="datetime-local" value={startsAt} /></label>
              <label className="build-field"><span>Location</span><input onChange={(event) => setLocation(event.target.value)} value={location} /></label>
              <label className="build-field"><span>Description</span><textarea onChange={(event) => setDescription(event.target.value)} rows={4} value={description} /></label>
              {formError && <p className="crud-error" role="alert">{formError}</p>}
              <div className="create-build-footer">
                <button className="build-cancel-button" onClick={closeDialog} type="button">Cancel</button>
                <button className="invite-button" disabled={isSaving} type="submit"><Icon name={editingActivity ? 'download' : 'plus'} /> {isSaving ? 'Saving…' : editingActivity ? 'Save activity' : 'Create activity'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
