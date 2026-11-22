import { useMemo, useState } from 'react'
import {
  createSuggestedBuild,
  getTierLabel,
  itemCatalog,
  skillCatalog,
  type GearSlot,
  type GuildSkill,
  type MemberBuild,
} from '../data/equipment'
import { initialMembers } from '../data/members'
import type { GuildBuild } from '../data/guildData'
import { useGuildRecords } from '../data/useGuildRecords'
import type { AuthUser } from '../data/authStorage'
import { Icon } from './Icon'

type BuildTemplate = {
  id: string
  owner_id: string | null
  name: string
  role: string
  style: 'PvP' | 'ZvZ' | 'PvE' | 'Gathering'
  description: string
  specialty: string
  build?: MemberBuild
}

const gearSlots: GearSlot[] = [
  'Bag',
  'Main hand',
  'Off hand',
  'Head',
  'Armor',
  'Shoes',
  'Potion',
  'Cape',
  'Food',
  'Mount',
]

type PickerOption = {
  id: string
  name: string
  detail: string
  badge: string
  itemId?: string
  skill?: GuildSkill
}

function ItemArtwork({ itemId, name }: { itemId: string; name: string }) {
  return (
    <span className="item-art">
      <span className="gear-fallback" hidden>{name.slice(0, 2)}</span>
      <img
        alt=""
        loading="lazy"
        onError={(event) => {
          event.currentTarget.hidden = true
          event.currentTarget.previousElementSibling?.removeAttribute('hidden')
        }}
        src={getItemIconUrl(itemId)}
      />
    </span>
  )
}

function getItemIconUrl(itemId: string) {
  return `https://render.albiononline.com/v1/item/${itemId}?quality=0&size=96`
}

function getSkillIconUrl(skillName: string) {
  return `https://render.albiononline.com/v1/spell/${encodeURIComponent(skillName)}.png?size=96&locale=en`
}

function GearImage({ item }: { item: MemberBuild['gear'][number] }) {
  return item.itemId ? (
    <ItemArtwork itemId={item.itemId} name={item.name} />
  ) : (
    <span className="gear-fallback">{item.name.slice(0, 2)}</span>
  )
}

function SkillArtwork({ skill }: { skill: GuildSkill }) {
  return (
    <span className="skill-artwork">
      <span className="skill-artwork-fallback">{skill.key}</span>
      <img
        alt=""
        loading="lazy"
        onError={(event) => { event.currentTarget.hidden = true }}
        src={getSkillIconUrl(skill.name)}
      />
      <span className={`skill-artwork-key${skill.key === 'Passive' ? ' passive' : ''}`}>{skill.key}</span>
    </span>
  )
}

function createEmptyBuild(): MemberBuild {
  return {
    gear: gearSlots.map((slot) => ({ slot, name: '', itemId: null, tier: 0 })),
    skills: [],
  }
}

export function CreateBuild({ currentUser }: { currentUser: AuthUser }) {
  const { records, isLoading, error, create, update, remove } =
    useGuildRecords<GuildBuild>('guild_builds', true)
  const [activeStyle, setActiveStyle] = useState<BuildTemplate['style'] | 'All'>('All')
  const [createOpen, setCreateOpen] = useState(false)
  const [editorStarted, setEditorStarted] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<BuildTemplate | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [buildName, setBuildName] = useState('')
  const [buildRole, setBuildRole] = useState('Balanced')
  const [buildStyle, setBuildStyle] = useState<BuildTemplate['style']>('PvP')
  const [buildDescription, setBuildDescription] = useState('')
  const [buildSpecialty, setBuildSpecialty] = useState('')
  const [build, setBuild] = useState<MemberBuild>({ gear: [], skills: [] })
  const [editingSlot, setEditingSlot] = useState<GearSlot | null>(null)
  const [skillPickerOpen, setSkillPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [saveError, setSaveError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const canManageBuild = (template: BuildTemplate) => template.owner_id === currentUser.id

  const templates: BuildTemplate[] = records.map((record) => ({
    ...record,
    build: record.build.gear.length > 0 ? record.build : undefined,
  }))
  const visibleTemplates = templates.filter((template) => activeStyle === 'All' || template.style === activeStyle)
  const selectedTemplateBuild = selectedTemplate
    ? selectedTemplate.build ?? createSuggestedBuild(
      initialMembers.find((member) => member.specialty === selectedTemplate.specialty) ?? initialMembers[0],
    )
    : null

  const itemOptions = useMemo(
    () => itemCatalog
      .filter((item) => item.slot === editingSlot)
      .map((item): PickerOption => ({
        id: item.itemId,
        itemId: item.itemId,
        name: item.name,
        detail: getTierLabel(item.tier),
        badge: `T${item.tier}`,
      })),
    [editingSlot],
  )

  const skillOptions = useMemo(
    () => skillCatalog
      .filter((skill) => !build.skills.some((selected) => selected.id === skill.id))
      .map((skill): PickerOption => ({
        id: skill.id,
        skill,
        name: skill.name,
        detail: `${skill.key} ability`,
        badge: skill.key,
      })),
    [build.skills],
  )

  const pickerOpen = editingSlot !== null || skillPickerOpen
  const options = (skillPickerOpen ? skillOptions : itemOptions).filter((option) =>
    `${option.name} ${option.detail} ${option.badge}`.toLowerCase().includes(query.trim().toLowerCase()),
  )

  const closePicker = () => {
    setEditingSlot(null)
    setSkillPickerOpen(false)
    setQuery('')
  }

  const chooseItem = (option: PickerOption) => {
    if (!editingSlot) return
    const selected = itemCatalog.find((item) => item.itemId === option.id)
    if (!selected) return
    setBuild((current) => ({
      ...current,
      gear: current.gear.map((item) => item.slot === editingSlot ? selected : item),
    }))
    closePicker()
  }

  const addSkill = (option: PickerOption) => {
    const skill = option.skill
    if (!skill) return
    setBuild((current) => ({
      ...current,
      skills: current.skills.some((selected) => selected.id === skill.id)
        ? current.skills
        : [...current.skills, skill],
    }))
    closePicker()
  }

  const startEditing = (template: BuildTemplate) => {
    const suggestedBuild = template.build ?? createSuggestedBuild(
      initialMembers.find((member) => member.specialty === template.specialty) ?? initialMembers[0],
    )
    setEditingId(template.id)
    setBuildName(template.name)
    setBuildRole(template.role)
    setBuildStyle(template.style)
    setBuildDescription(template.description)
    setBuildSpecialty(template.specialty)
    setBuild(suggestedBuild)
    setEditorStarted(false)
    setSelectedTemplate(null)
    setSaveError('')
    setCreateOpen(true)
  }

  const saveBuild = async () => {
    const name = buildName.trim() || 'Untitled build'
    const record = {
      name,
      role: buildRole,
      style: buildStyle,
      description: buildDescription.trim(),
      specialty: buildSpecialty.trim(),
      build,
    }
    setIsSaving(true)
    setSaveError('')
    try {
      if (editingId) await update(editingId, record)
      else await create(record)
      setCreateOpen(false)
      setEditorStarted(false)
      setEditingId(null)
    } catch (error) {
      console.error('Unable to save guild build.', error)
      setSaveError(error instanceof Error ? error.message : 'Unable to save this build.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteBuild = async (template: BuildTemplate) => {
    if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return
    setActionError('')
    try {
      await remove(template.id)
      if (selectedTemplate?.id === template.id) setSelectedTemplate(null)
    } catch (error) {
      console.error('Unable to delete guild build.', error)
      setActionError(error instanceof Error ? error.message : 'Unable to delete this build.')
    }
  }

  const closeCreate = () => {
    setCreateOpen(false)
    setEditorStarted(false)
    setEditingId(null)
    setEditingSlot(null)
    setSkillPickerOpen(false)
  }

  return (
    <section className="create-build-page" aria-label="Set build">
      {(error || actionError) && <p className="crud-error" role="alert">{error || actionError}</p>}
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> BUILD COLLECTION</div>
          <h1>Set build</h1>
          <p className="page-description">Create builds; only the creator can edit or delete them.</p>
        </div>
        <button
          className="invite-button"
          onClick={() => {
            setEditingId(null)
            setBuildName('')
            setBuildRole('Balanced')
            setBuildStyle('PvP')
            setBuildDescription('')
            setBuildSpecialty('')
            setBuild(createEmptyBuild())
            setEditorStarted(false)
            setSaveError('')
            setCreateOpen(true)
          }}
          type="button"
        >
          <Icon name="plus" /> Create build
        </button>
      </div>

      {selectedTemplate && selectedTemplateBuild ? (
        <div className="template-details">
          <button className="back-button" onClick={() => setSelectedTemplate(null)} type="button">
            <Icon name="chevronLeft" /> Back to builds
          </button>
          <div className="details-heading">
            <span className="build-card-art"><Icon name="swords" /></span>
            <div className="details-title">
              <div className="eyebrow"><span className="eyebrow-line" /> {selectedTemplate.style.toUpperCase()} BUILD</div>
              <h1>{selectedTemplate.name}</h1>
              <div className="details-subtitle">
                <span className="role-badge veteran">{selectedTemplate.role}</span>
                <span className="detail-specialty">{selectedTemplate.specialty}</span>
              </div>
            </div>
            {canManageBuild(selectedTemplate) && (
              <div className="crud-actions">
                <button className="export-button" onClick={() => startEditing(selectedTemplate)} type="button">Edit</button>
                <button className="export-button danger-action" onClick={() => void deleteBuild(selectedTemplate)} type="button">Delete</button>
              </div>
            )}
          </div>
          <div className="details-layout">
            <div className="build-column">
              <section className="loadout-panel">
                <div className="details-section-heading">
                  <div><h2>Equipment loadout</h2><p>{selectedTemplate.description}</p></div>
                </div>
                <div className="loadout-overview">
                  <div className="gear-board" aria-label="Equipment slots">
                    {selectedTemplateBuild.gear.map((item, index) => (
                      <div className={`gear-slot ${item.slot.toLowerCase().replace(' ', '-')}`} key={item.slot}>
                        <GearImage item={item} />
                        <span className="gear-slot-number">{index + 1}</span>
                      </div>
                    ))}
                  </div>
                  <div className="equipment-grid">
                    {selectedTemplateBuild.gear.map((item) => (
                      <div className="equipment-card" key={item.slot}>
                        <span className="equipment-icon"><GearImage item={item} /></span>
                        <span className="equipment-copy">
                          <small>{item.slot}</small>
                          <strong>{item.name}</strong>
                          <span>{item.slot === 'Food' || item.slot === 'Potion' ? 'Consumable' : getTierLabel(item.tier)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
              <section className="skills-panel">
                <div className="details-section-heading">
                  <div><h2>Skills</h2><p>Abilities included in this build.</p></div>
                </div>
                <div className="skills-list">
                  {selectedTemplateBuild.skills.map((skill) => (
                    <article className="selected-skill" key={skill.id}>
                      <SkillArtwork skill={skill} />
                      <span className="selected-skill-copy"><strong>{skill.name}</strong><small>{skill.key} ability</small></span>
                    </article>
                  ))}
                </div>
              </section>
            </div>
            <aside className="member-info-panel">
              <div className="details-section-heading"><div><h2>Build details</h2><p>Overview of this loadout.</p></div></div>
              <dl className="member-info-list">
                <div><dt>Build style</dt><dd>{selectedTemplate.style}</dd></div>
                <div><dt>Role</dt><dd>{selectedTemplate.role}</dd></div>
                <div><dt>Equipment slots</dt><dd>{selectedTemplateBuild.gear.length}</dd></div>
                <div><dt>Selected skills</dt><dd>{selectedTemplateBuild.skills.length}</dd></div>
              </dl>
            </aside>
          </div>
        </div>
      ) : (
        <>
          {isLoading && <p className="crud-status" role="status">Loading guild builds…</p>}
          <div className="build-style-tabs" role="tablist" aria-label="Build styles">
            {(['All', 'PvP', 'ZvZ', 'PvE', 'Gathering'] as const).map((style) => (
              <button
                aria-selected={activeStyle === style}
                className={`build-style-tab${activeStyle === style ? ' selected' : ''}`}
                key={style}
                onClick={() => setActiveStyle(style)}
                role="tab"
                type="button"
              >
                {style}
                {style === 'All' && <span>{visibleTemplates.length}</span>}
              </button>
            ))}
          </div>

          {!isLoading && !error && (
            <div className="build-card-grid">
              {visibleTemplates.map((template) => (
                <div className="crud-card-wrap" key={template.id}>
                  <article
                    aria-label={`View ${template.name} details`}
                    className="build-card"
                    onClick={() => setSelectedTemplate(template)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedTemplate(template)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="build-card-top">
                      <span className={`build-style-badge ${template.style.toLowerCase()}`}>{template.style}</span>
                      <span className="row-menu" aria-hidden="true"><Icon name="more" /></span>
                    </div>
                    <span className="build-card-art"><Icon name="swords" /></span>
                    <div className="build-card-copy">
                      <h2>{template.name}</h2>
                      <p>{template.description}</p>
                    </div>
                    <div className="build-card-meta">
                      <span>{template.role}</span>
                      <span>{template.specialty}</span>
                    </div>
                    <span className="build-card-action">View build <Icon name="arrowUpRight" /></span>
                  </article>
                  {canManageBuild(template) && (
                    <div className="crud-card-actions">
                      <button className="export-button" onClick={() => startEditing(template)} type="button">Edit</button>
                      <button className="export-button danger-action" onClick={() => void deleteBuild(template)} type="button">Delete</button>
                    </div>
                  )}
                </div>
              ))}
              {visibleTemplates.length === 0 && <p className="crud-status">No builds in this category yet.</p>}
            </div>
          )}
        </>
      )}

      {createOpen && (
        <div className="picker-backdrop create-build-backdrop" onMouseDown={closeCreate}>
          <section
            aria-labelledby="create-build-title"
            aria-modal="true"
            className="create-build-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="picker-heading">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> NEW LOADOUT</div>
                <h2 id="create-build-title">{editingId ? 'Edit build' : 'Create build'}</h2>
                <p>{editorStarted ? 'Configure equipment and skills for a guild build.' : 'Start by naming your build and choosing its role.'}</p>
              </div>
              <button className="picker-close" type="button" aria-label="Close create build" onClick={closeCreate}>
                <Icon name="close" />
              </button>
            </div>

            <div className="create-build-content">
              {!editorStarted && (
                <div className="create-build-fields">
                  <label className="build-field">
                    <span>Build title</span>
                    <input autoFocus value={buildName} onChange={(event) => setBuildName(event.target.value)} placeholder="e.g. Covenant War Build" />
                  </label>
                  <label className="build-field">
                    <span>Build role</span>
                    <select value={buildRole} onChange={(event) => setBuildRole(event.target.value)}>
                      <option>Balanced</option>
                      <option>Tank</option>
                      <option>Healer</option>
                      <option>Damage</option>
                      <option>Support</option>
                      <option>Gatherer</option>
                    </select>
                  </label>
                  <label className="build-field">
                    <span>Build style</span>
                    <select value={buildStyle} onChange={(event) => setBuildStyle(event.target.value as BuildTemplate['style'])}>
                      <option>PvP</option>
                      <option>ZvZ</option>
                      <option>PvE</option>
                      <option>Gathering</option>
                    </select>
                  </label>
                  <label className="build-field"><span>Specialty</span><input maxLength={120} onChange={(event) => setBuildSpecialty(event.target.value)} value={buildSpecialty} /></label>
                  <label className="build-field"><span>Description</span><input maxLength={1000} onChange={(event) => setBuildDescription(event.target.value)} value={buildDescription} /></label>
                </div>
              )}

              {editorStarted && (
                <div className="create-loadout-layout">
                  <div className="gear-board" aria-label="Equipment slots">
                    {build.gear.map((item, index) => (
                      <button
                        aria-label={item.itemId ? `Replace ${item.slot}: ${item.name}` : `Choose ${item.slot} item`}
                        className={`gear-slot ${item.slot.toLowerCase().replace(' ', '-')}`}
                        key={item.slot}
                        onClick={() => { setEditingSlot(item.slot); setQuery('') }}
                        type="button"
                      >
                        {item.itemId
                          ? <GearImage item={item} />
                          : <span className="gear-empty-slot"><Icon name="plus" />Add</span>}
                        <span className="gear-slot-number">{index + 1}</span>
                        <span className="gear-edit-hint">{item.itemId ? 'Edit' : 'Add item'}</span>
                      </button>
                    ))}
                  </div>

                  <div className="create-build-skills">
                    <div className="create-skills-heading">
                      <strong>Build skills</strong>
                      <button className="add-skill-button" onClick={() => { setSkillPickerOpen(true); setQuery('') }} type="button">
                        <Icon name="plus" /> Add
                      </button>
                    </div>
                    <div className="create-skills-list">
                      {build.skills.map((skill) => (
                        <article className="selected-skill" key={skill.id}>
                          <SkillArtwork skill={skill} />
                          <span className="selected-skill-copy"><strong>{skill.name}</strong><small>{skill.key} ability</small></span>
                          <button
                            aria-label={`Remove ${skill.name}`}
                            className="remove-skill-button"
                            onClick={() => setBuild((current) => ({ ...current, skills: current.skills.filter((selected) => selected.id !== skill.id) }))}
                            type="button"
                          >
                            <Icon name="close" />
                          </button>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="create-build-footer">
              {editorStarted && (
                <button className="build-cancel-button" onClick={() => setEditorStarted(false)} type="button">
                  Back to details
                </button>
              )}
              <button className="build-cancel-button" onClick={closeCreate} type="button">Cancel</button>
              <button
                className="invite-button"
              disabled={isSaving}
                onClick={() => {
                  if (editorStarted) {
                    void saveBuild()
                    return
                  }
                  setEditorStarted(true)
                }}
                type="button"
              >
                {editorStarted
                  ? <><Icon name="download" /> {isSaving ? 'Saving…' : editingId ? 'Save changes' : 'Save build'}</>
                  : <><Icon name="plus" /> {editingId ? 'Continue' : 'Create'}</>}
              </button>
            </div>
            {saveError && <p className="crud-error build-save-error" role="alert">{saveError}</p>}
          </section>
        </div>
      )}

      {pickerOpen && (
        <div className="picker-backdrop nested-picker-backdrop" onMouseDown={closePicker}>
          <section
            aria-labelledby="build-option-title"
            aria-modal="true"
            className="picker-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="picker-heading">
              <div>
                <h2 id="build-option-title">{skillPickerOpen ? 'Add skill' : `Choose ${editingSlot}`}</h2>
                <p>Search the Albion item and ability list.</p>
              </div>
              <button aria-label="Close picker" className="picker-close" onClick={closePicker} type="button">
                <Icon name="close" />
              </button>
            </div>
            <label className="picker-search">
              <Icon name="search" />
              <input aria-label="Search options" autoFocus onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or tier..." type="search" value={query} />
            </label>
            <div className="picker-results">
              {options.map((option) => (
                <button className="picker-option" key={option.id} onClick={() => skillPickerOpen ? addSkill(option) : chooseItem(option)} type="button">
                  <span className={`picker-option-icon${option.itemId ? ' item' : ''}${option.skill ? ' skill' : ''}`}>
                    {option.skill
                      ? <SkillArtwork skill={option.skill} />
                      : option.itemId
                        ? <ItemArtwork itemId={option.itemId} name={option.name} />
                        : <span>{option.badge}</span>}
                  </span>
                  <span className="picker-option-copy"><strong>{option.name}</strong><small>{option.detail}</small></span>
                  <span className="picker-option-badge">{option.badge}</span>
                </button>
              ))}
              {options.length === 0 && (
                <div className="picker-empty"><Icon name="search" /><strong>No matches</strong><span>Try a different search.</span></div>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
