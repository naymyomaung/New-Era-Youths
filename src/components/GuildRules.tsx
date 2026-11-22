import { useState, type FormEvent } from 'react'
import { useGuildRecords } from '../data/useGuildRecords'
import type { GuildRule } from '../data/guildData'
import { Icon } from './Icon'

export function GuildRules({ canManage }: { canManage: boolean }) {
  const { records: rules, isLoading, error, create, update, remove } =
    useGuildRecords<GuildRule>('guild_rules', true)
  const [selectedRule, setSelectedRule] = useState<GuildRule | null>(null)
  const [editingRule, setEditingRule] = useState<GuildRule | null>(null)
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false)
  const [ruleTitle, setRuleTitle] = useState('')
  const [ruleCategory, setRuleCategory] = useState('Community')
  const [ruleDescription, setRuleDescription] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState('')

  const openRuleDialog = (rule?: GuildRule) => {
    setEditingRule(rule ?? null)
    setRuleTitle(rule?.title ?? '')
    setRuleCategory(rule?.category ?? 'Community')
    setRuleDescription(rule?.description ?? '')
    setFormError('')
    setIsRuleDialogOpen(true)
  }

  const closeRuleDialog = () => {
    setIsRuleDialogOpen(false)
    setEditingRule(null)
    setFormError('')
  }

  const saveRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = ruleTitle.trim()
    const description = ruleDescription.trim()
    if (!title || !description) {
      setFormError('Enter a title and rule description.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const record = { title, category: ruleCategory, description }
      const saved = editingRule
        ? await update(editingRule.id, record)
        : await create(record)
      setSelectedRule(saved)
      closeRuleDialog()
    } catch (saveError) {
      console.error('Unable to save guild rule.', saveError)
      setFormError(saveError instanceof Error ? saveError.message : 'Unable to save this rule.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteRule = async (rule: GuildRule) => {
    if (!window.confirm(`Delete "${rule.title}"? This cannot be undone.`)) return
    setActionError('')
    try {
      await remove(rule.id)
      if (selectedRule?.id === rule.id) setSelectedRule(null)
    } catch (deleteError) {
      console.error('Unable to delete guild rule.', deleteError)
      setActionError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this rule.')
    }
  }

  return (
    <section className="guild-rules-page" aria-label="Guild rules">
      {(error || actionError) && <p className="crud-error" role="alert">{error || actionError}</p>}
      {selectedRule ? (
        <>
          <button className="back-button" onClick={() => setSelectedRule(null)} type="button">
            <Icon name="chevronLeft" /> Back to rules
          </button>
          <div className="page-heading rule-details-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> GUILD RULE</div>
              <h1>{selectedRule.title}</h1>
              <p className="page-description">{selectedRule.category}</p>
            </div>
            {canManage && (
              <div className="crud-actions">
                <button className="export-button" onClick={() => openRuleDialog(selectedRule)} type="button">Edit</button>
                <button className="export-button danger-action" onClick={() => void deleteRule(selectedRule)} type="button">Delete</button>
              </div>
            )}
          </div>
          <section className="rule-detail-panel">
            <div className="details-section-heading">
              <div><h2>Rule details</h2><p>This rule applies to all guild members.</p></div>
              <span className="build-style-badge pvp">{selectedRule.category}</span>
            </div>
            <p className="rule-detail-description">{selectedRule.description}</p>
          </section>
        </>
      ) : (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> GUILD COMMUNITY</div>
              <h1>Guild rules</h1>
              <p className="page-description">Shared guidelines for everyone in New Era Youths.</p>
            </div>
            {canManage && <button className="invite-button" onClick={() => openRuleDialog()} type="button"><Icon name="plus" /> Add Rule</button>}
          </div>
          {isLoading && <p className="crud-status" role="status">Loading guild rules…</p>}
          {!isLoading && !error && (
            <div className="guild-rule-grid">
              {rules.map((rule) => (
                <div className="crud-card-wrap" key={rule.id}>
                  <button className="guild-rule-card" onClick={() => setSelectedRule(rule)} type="button">
                    <span className="guild-rule-icon"><Icon name="crest" /></span>
                    <span className="guild-rule-copy">
                      <small>{rule.category}</small>
                      <strong>{rule.title}</strong>
                      <span>{rule.description}</span>
                    </span>
                    <span className="guild-rule-link">View details <Icon name="arrowUpRight" /></span>
                  </button>
                  {canManage && (
                    <div className="crud-card-actions">
                      <button className="export-button" onClick={() => openRuleDialog(rule)} type="button">Edit</button>
                      <button className="export-button danger-action" onClick={() => void deleteRule(rule)} type="button">Delete</button>
                    </div>
                  )}
                </div>
              ))}
              {rules.length === 0 && <p className="crud-status">No rules yet.</p>}
            </div>
          )}
        </>
      )}

      {isRuleDialogOpen && (
        <div className="picker-backdrop" onMouseDown={closeRuleDialog}>
          <section aria-labelledby="add-rule-title" aria-modal="true" className="rule-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <div className="picker-heading">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> GUILD COMMUNITY</div>
                <h2 id="add-rule-title">{editingRule ? 'Edit Rule' : 'Add Rule'}</h2>
                <p>{editingRule ? 'Update this guild guideline.' : 'Add a guideline to the guild rules list.'}</p>
              </div>
              <button aria-label="Close dialog" className="picker-close" onClick={closeRuleDialog} type="button"><Icon name="close" /></button>
            </div>
            <form className="rule-form" onSubmit={saveRule}>
              <label className="build-field"><span>Rule title</span><input autoFocus onChange={(event) => setRuleTitle(event.target.value)} placeholder="e.g. Be respectful" required value={ruleTitle} /></label>
              <label className="build-field">
                <span>Category</span>
                <select onChange={(event) => setRuleCategory(event.target.value)} value={ruleCategory}>
                  <option>Community</option><option>Communication</option><option>Guild events</option><option>Combat</option><option>Other</option>
                </select>
              </label>
              <label className="build-field"><span>Rule details</span><textarea onChange={(event) => setRuleDescription(event.target.value)} placeholder="Describe this guild rule..." required rows={4} value={ruleDescription} /></label>
              {formError && <p className="crud-error" role="alert">{formError}</p>}
              <div className="create-build-footer">
                <button className="build-cancel-button" onClick={closeRuleDialog} type="button">Cancel</button>
                <button className="invite-button" disabled={isSaving} type="submit"><Icon name={editingRule ? 'download' : 'plus'} /> {isSaving ? 'Saving…' : editingRule ? 'Save Rule' : 'Add Rule'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
