import { useState, type FormEvent } from 'react'
import { useGuildRecords } from '../data/useGuildRecords'
import type { GuildGuide } from '../data/guildData'
import { Icon } from './Icon'

export function GuildGuides({ canManage }: { canManage: boolean }) {
  const { records: guides, isLoading, error, create, update, remove } =
    useGuildRecords<GuildGuide>('guild_guides', true)
  const [selectedGuide, setSelectedGuide] = useState<GuildGuide | null>(null)
  const [editingGuide, setEditingGuide] = useState<GuildGuide | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('General')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const openDialog = (guide?: GuildGuide) => {
    setEditingGuide(guide ?? null)
    setTitle(guide?.title ?? '')
    setCategory(guide?.category ?? 'General')
    setSummary(guide?.summary ?? '')
    setContent(guide?.content ?? '')
    setFormError('')
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingGuide(null)
    setFormError('')
  }

  const saveGuide = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = { title: title.trim(), category, summary: summary.trim(), content: content.trim() }
    if (!values.title || !values.summary || !values.content) {
      setFormError('Enter a title, summary, and guide content.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const saved = editingGuide
        ? await update(editingGuide.id, values)
        : await create(values)
      setSelectedGuide(saved)
      closeDialog()
    } catch (saveError) {
      console.error('Unable to save guild guide.', saveError)
      setFormError(saveError instanceof Error ? saveError.message : 'Unable to save this guide.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteGuide = async (guide: GuildGuide) => {
    if (!window.confirm(`Delete "${guide.title}"? This cannot be undone.`)) return
    setActionError('')
    try {
      await remove(guide.id)
      if (selectedGuide?.id === guide.id) setSelectedGuide(null)
    } catch (deleteError) {
      console.error('Unable to delete guild guide.', deleteError)
      setActionError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this guide.')
    }
  }

  return (
    <section className="guild-guides-page" aria-label="Guild guides">
      {(error || actionError) && <p className="crud-error" role="alert">{error || actionError}</p>}
      {selectedGuide ? (
        <>
          <button className="back-button" onClick={() => setSelectedGuide(null)} type="button"><Icon name="chevronLeft" /> Back to guides</button>
          <div className="page-heading guide-details-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> GUILD GUIDE</div>
              <h1>{selectedGuide.title}</h1>
              <p className="page-description">{selectedGuide.summary}</p>
            </div>
            <div className="guide-detail-actions">
              <span className="build-style-badge pvp">{selectedGuide.category}</span>
              {canManage && <button className="export-button" onClick={() => openDialog(selectedGuide)} type="button">Edit</button>}
              {canManage && <button className="export-button danger-action" onClick={() => void deleteGuide(selectedGuide)} type="button">Delete</button>}
            </div>
          </div>
          <article className="guide-detail-panel">
            <div className="details-section-heading">
              <div><h2>{selectedGuide.title}</h2><p>{selectedGuide.category}</p></div>
              <span className="guide-detail-icon"><Icon name="crest" /></span>
            </div>
            <p className="guide-detail-content">{selectedGuide.content}</p>
          </article>
        </>
      ) : (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> GUILD KNOWLEDGE</div>
              <h1>Guild guides</h1>
              <p className="page-description">Helpful guides for members of New Era Youths.</p>
            </div>
            {canManage && <button className="invite-button" onClick={() => openDialog()} type="button"><Icon name="plus" /> Create Guide</button>}
          </div>
          {isLoading && <p className="crud-status" role="status">Loading guild guides…</p>}
          {!isLoading && !error && (
            <div className="guide-card-grid">
              {guides.map((guide) => (
                <div className="crud-card-wrap" key={guide.id}>
                  <button className="guide-card" onClick={() => setSelectedGuide(guide)} type="button">
                    <span className="guide-card-icon"><Icon name="crest" /></span>
                    <span className="build-style-badge pvp">{guide.category}</span>
                    <strong>{guide.title}</strong>
                    <span className="guide-card-summary">{guide.summary}</span>
                    <span className="guide-card-link">Read guide <Icon name="arrowUpRight" /></span>
                  </button>
                  {canManage && (
                    <div className="crud-card-actions">
                      <button className="export-button" onClick={() => openDialog(guide)} type="button">Edit</button>
                      <button className="export-button danger-action" onClick={() => void deleteGuide(guide)} type="button">Delete</button>
                    </div>
                  )}
                </div>
              ))}
              {guides.length === 0 && <p className="crud-status">No guides yet.</p>}
            </div>
          )}
        </>
      )}

      {isDialogOpen && (
        <div className="picker-backdrop" onMouseDown={closeDialog}>
          <section aria-labelledby="create-guide-title" aria-modal="true" className="rule-dialog guide-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <div className="picker-heading">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> GUILD KNOWLEDGE</div>
                <h2 id="create-guide-title">{editingGuide ? 'Edit Guide' : 'Create Guide'}</h2>
                <p>{editingGuide ? 'Update this guild guide.' : 'Add a guide to the guild library.'}</p>
              </div>
              <button aria-label="Close dialog" className="picker-close" onClick={closeDialog} type="button"><Icon name="close" /></button>
            </div>
            <form className="rule-form" onSubmit={saveGuide}>
              <label className="build-field"><span>Guide title</span><input autoFocus onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Group combat basics" required value={title} /></label>
              <label className="build-field">
                <span>Category</span>
                <select onChange={(event) => setCategory(event.target.value)} value={category}>
                  <option>General</option><option>New members</option><option>Activities</option><option>Equipment</option><option>Gathering</option><option>Other</option>
                </select>
              </label>
              <label className="build-field"><span>Summary</span><input onChange={(event) => setSummary(event.target.value)} placeholder="Short description for the guide card" required value={summary} /></label>
              <label className="build-field"><span>Guide content</span><textarea onChange={(event) => setContent(event.target.value)} placeholder="Write the guide..." required rows={5} value={content} /></label>
              {formError && <p className="crud-error" role="alert">{formError}</p>}
              <div className="create-build-footer">
                <button className="build-cancel-button" onClick={closeDialog} type="button">Cancel</button>
                <button className="invite-button" disabled={isSaving} type="submit"><Icon name={editingGuide ? 'download' : 'plus'} /> {isSaving ? 'Saving…' : editingGuide ? 'Save Guide' : 'Create Guide'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
