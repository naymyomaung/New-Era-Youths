import { useEffect, useMemo, useState } from 'react'
import type { GuildMember } from '../data/members'
import {
  createSuggestedBuild,
  getTierLabel,
  isMemberBuild,
  itemCatalog,
  skillCatalog,
  type CatalogItem,
  type GearItem,
  type GearSlot,
  type GuildSkill,
  type MemberBuild,
} from '../data/equipment'
import type { MemberBuildRecord } from '../data/guildData'
import { useGuildRecords } from '../data/useGuildRecords'
import { Icon } from './Icon'

type PickerOption = {
  id: string
  name: string
  detail: string
  badge: string
  itemId?: string
  skill?: GuildSkill
}

function getItemIconUrl(itemId: string) {
  return `https://render.albiononline.com/v1/item/${itemId}?quality=0&size=96`
}

function getSkillIconUrl(skillName: string) {
  return `https://render.albiononline.com/v1/spell/${encodeURIComponent(skillName)}.png?size=96&locale=en`
}

function toItemPickerOption(item: CatalogItem): PickerOption {
  return {
    id: item.itemId,
    itemId: item.itemId,
    name: item.name,
    detail: getTierLabel(item.tier),
    badge: `T${item.tier}`,
  }
}

function toSkillPickerOption(skill: GuildSkill): PickerOption {
  return {
    id: skill.id,
    name: skill.name,
    detail: `${skill.key} ability`,
    badge: skill.key,
    skill,
  }
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
      <span className={`skill-artwork-key${skill.key === 'Passive' ? ' passive' : ''}`}>
        {skill.key}
      </span>
    </span>
  )
}

function SearchPicker({
  title,
  options,
  onChoose,
  onClose,
}: {
  title: string
  options: PickerOption[]
  onChoose: (option: PickerOption) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const filteredOptions = useMemo(() => {
    const search = query.trim().toLowerCase()
    return options.filter((option) =>
      `${option.name} ${option.detail} ${option.badge}`.toLowerCase().includes(search),
    )
  }, [options, query])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="picker-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="picker-title"
        aria-modal="true"
        className="picker-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="picker-heading">
          <div>
            <h2 id="picker-title">{title}</h2>
            <p>Search the Albion item and ability list.</p>
          </div>
          <button aria-label="Close picker" className="picker-close" onClick={onClose} type="button">
            <Icon name="close" />
          </button>
        </div>

        <label className="picker-search">
          <Icon name="search" />
          <input
            aria-label={`Search ${title.toLowerCase()}`}
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or tier..."
            type="search"
            value={query}
          />
        </label>

        <div className="picker-results">
          {filteredOptions.map((option) => (
            <button
              className="picker-option"
              key={option.id}
              onClick={() => onChoose(option)}
              type="button"
            >
              <span className={`picker-option-icon${option.itemId ? ' item' : ''}${option.skill ? ' skill' : ''}`}>
                {option.skill
                  ? <SkillArtwork skill={option.skill} />
                  : option.itemId
                    ? <img alt="" loading="lazy" src={getItemIconUrl(option.itemId)} />
                    : <span>{option.badge}</span>}
              </span>
              <span className="picker-option-copy">
                <strong>{option.name}</strong>
                <small>{option.detail}</small>
              </span>
              <span className="picker-option-badge">{option.badge}</span>
            </button>
          ))}
          {filteredOptions.length === 0 && (
            <div className="picker-empty">
              <Icon name="search" />
              <strong>No matches</strong>
              <span>Try a different search.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function GearImage({ item, large = false }: { item: GearItem; large?: boolean }) {
  return item.itemId ? (
    <img
      alt={large ? '' : `${item.name} icon`}
      loading="lazy"
      src={getItemIconUrl(item.itemId)}
    />
  ) : (
    <span className="gear-fallback">{item.name.slice(0, 2)}</span>
  )
}

export function MemberDetails({
  member,
  onBack,
  canManage,
}: {
  member: GuildMember
  onBack: () => void
  canManage: boolean
}) {
  const { records, isLoading: buildLoading, error: loadError, update, remove } =
    useGuildRecords<MemberBuildRecord>('member_builds', true)
  const [saveError, setSaveError] = useState('')
  const [editingSlot, setEditingSlot] = useState<GearSlot | null>(null)
  const [isSkillPickerOpen, setIsSkillPickerOpen] = useState(false)
  const storedBuild = records.find((record) => record.member_id === member.id)
  const invalidStoredBuild = Boolean(storedBuild && !isMemberBuild(storedBuild.build))
  const build = useMemo(() => {
    if (!storedBuild || !isMemberBuild(storedBuild.build)) return createSuggestedBuild(member)
    const defaults = createSuggestedBuild(member).gear
    const gearBySlot = new Map(storedBuild.build.gear.map((item) => [item.slot, item]))
    const gear = defaults.map((item) => gearBySlot.get(item.slot) ?? item)
    const skills = storedBuild.build.skills.map((skill) => {
      const replacementId = skill.id === 'whirling-blades'
        ? 'blood-bandit'
        : skill.id === 'great-holy-beam'
          ? 'holy-beam'
          : skill.id === 'deathgivers'
            ? 'chain-slash'
            : null
      return replacementId
        ? skillCatalog.find((option) => option.id === replacementId) ?? skill
        : skill
    })
    return { ...storedBuild.build, gear, skills }
  }, [member, storedBuild])

  const updateBuild = async (change: (current: MemberBuild) => MemberBuild) => {
    const updated = change(build)
    setSaveError('')
    try {
      await update(member.id, { member_id: member.id, build: updated })
    } catch (error) {
      console.error(`Unable to save the build for ${member.name}.`, error)
      setSaveError(error instanceof Error ? error.message : 'Unable to save this build.')
    }
  }

  const resetBuild = async () => {
    if (!storedBuild) return
    setSaveError('')
    try {
      await remove(member.id)
    } catch (error) {
      console.error(`Unable to reset the build for ${member.name}.`, error)
      setSaveError(error instanceof Error ? error.message : 'Unable to reset this build.')
    }
  }

  const itemOptions = useMemo(
    () => itemCatalog.filter((item) => item.slot === editingSlot).map(toItemPickerOption),
    [editingSlot],
  )
  const availableSkills = useMemo(
    () => skillCatalog
      .filter((skill) => !build.skills.some((selected) => selected.id === skill.id))
      .map(toSkillPickerOption),
    [build.skills],
  )

  const chooseItem = (option: PickerOption) => {
    if (!editingSlot) return
    const selected = itemCatalog.find((item) => item.itemId === option.id)
    if (!selected) {
      console.error(`Could not find item ${option.id} in the catalog.`)
      return
    }

    updateBuild((current) => ({
      ...current,
      gear: current.gear.map((item) => item.slot === editingSlot ? selected : item),
    }))
    setEditingSlot(null)
  }

  const addSkill = (option: PickerOption) => {
    const selected = skillCatalog.find((skill) => skill.id === option.id)
    if (!selected) {
      console.error(`Could not find skill ${option.id} in the catalog.`)
      return
    }

    updateBuild((current) => (
      current.skills.some((skill) => skill.id === selected.id)
        ? current
        : { ...current, skills: [...current.skills, selected] }
    ))
    setIsSkillPickerOpen(false)
  }

  const removeSkill = (skillId: string) => {
    updateBuild((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill.id !== skillId),
    }))
  }

  return (
    <section className="member-details" aria-label={`${member.name} member details`}>
      <button className="back-button" onClick={onBack} type="button">
        <Icon name="chevronLeft" /> Back to members
      </button>

      <div className="details-heading">
        <span className={`details-avatar ${member.avatarTone}`}>{member.avatar}</span>
        <div className="details-title">
          <div className="eyebrow"><span className="eyebrow-line" /> GUILD MEMBER PROFILE</div>
          <h1>{member.name}</h1>
          <div className="details-subtitle">
            <span className={`role-badge ${member.role === 'Guild Master' ? 'master' : member.role.toLowerCase()}`}>{member.role}</span>
            <span className="detail-specialty">{member.specialty}</span>
            <span className="member-status"><i className={member.online ? 'online' : ''} />{member.online ? 'Online now' : 'Offline'}</span>
          </div>
        </div>
      </div>

      <div className="details-layout">
        <div className="build-column">
          <section className="loadout-panel">
            <div className="details-section-heading">
              <div><h2>Equipment loadout</h2><p>Select a slot to search and replace its item.</p></div>
              {canManage && (
                <div className="crud-actions">
                  <span className="sample-build-badge">EDITABLE</span>
                  {storedBuild && <button className="export-button danger-action" onClick={() => void resetBuild()} type="button">Reset loadout</button>}
                </div>
              )}
            </div>
            <div className="loadout-overview">
              <div className="gear-board" aria-label="Equipment slots">
                {build.gear.map((item, index) => (
                  <button
                    aria-label={`Replace ${item.slot}: ${item.name}`}
                    className={`gear-slot ${item.slot.toLowerCase().replace(' ', '-')}`}
                    key={item.slot}
                    disabled={!canManage || buildLoading}
                    onClick={() => setEditingSlot(item.slot)}
                    title={`Replace ${item.slot}: ${item.name}`}
                    type="button"
                  >
                    <GearImage item={item} large />
                    <span className="gear-slot-number">{index + 1}</span>
                    <span className="gear-edit-hint">Edit</span>
                  </button>
                ))}
              </div>
              <div className="equipment-grid">
                {build.gear.map((item) => (
                  <button
                    className="equipment-card"
                    disabled={!canManage || buildLoading}
                    key={item.slot}
                    onClick={() => setEditingSlot(item.slot)}
                    type="button"
                  >
                    <span className="equipment-icon"><GearImage item={item} /></span>
                    <span className="equipment-copy">
                      <small>{item.slot}</small>
                      <strong>{item.name}</strong>
                      <span>{item.slot === 'Food' || item.slot === 'Potion' ? 'Suggested consumable' : getTierLabel(item.tier)}</span>
                    </span>
                    <span className="equipment-replace">Replace</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="loadout-disclaimer">{buildLoading ? 'Loading the saved loadout…' : canManage ? 'Changes are saved to the guild database.' : 'This loadout is read-only.'}</p>
          </section>

          <section className="skills-panel">
            <div className="details-section-heading">
              <div><h2>Skills</h2><p>Choose abilities for this member’s build.</p></div>
              {canManage && <button className="add-skill-button" disabled={buildLoading} onClick={() => setIsSkillPickerOpen(true)} type="button">
                <Icon name="plus" /> Add skill
              </button>}
            </div>
            {build.skills.length > 0 ? (
              <div className="skills-list">
                {build.skills.map((skill) => (
                  <article className="selected-skill" key={skill.id}>
                    <SkillArtwork skill={skill} />
                    <span className="selected-skill-copy"><strong>{skill.name}</strong><small>{skill.key === 'Passive' ? 'Passive ability' : `${skill.key} ability`}</small></span>
                    <button
                      aria-label={`Remove ${skill.name}`}
                      className="remove-skill-button"
                      disabled={!canManage || buildLoading}
                      onClick={() => void removeSkill(skill.id)}
                      type="button"
                    >
                      <Icon name="close" />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="skills-empty">No skills added yet. Use Add skill to choose abilities.</div>
            )}
          </section>
          {(saveError || loadError || invalidStoredBuild) && <p className="storage-warning" role="alert">{saveError || loadError || 'The saved build has an invalid format.'}</p>}
        </div>

        <aside className="member-info-panel">
          <div className="details-section-heading"><div><h2>General info</h2><p>Guild activity and member stats.</p></div></div>
          <dl className="member-info-list">
            <div><dt>Guild role</dt><dd>{member.role}</dd></div>
            <div><dt>Specialty</dt><dd>{member.specialty}</dd></div>
            <div><dt>Season fame</dt><dd className="detail-fame"><Icon name="swords" />{member.fame}</dd></div>
            <div><dt>Member status</dt><dd><span className={`detail-status${member.online ? ' online' : ''}`}><i />{member.online ? 'Online' : 'Offline'}</span></dd></div>
            <div><dt>Last active</dt><dd>{member.lastActive}</dd></div>
            <div><dt>Guild</dt><dd>New Era Youths</dd></div>
          </dl>
          <div className="member-note">
            <span className="season-icon"><Icon name="trophy" /></span>
            <p><strong>Part of the Covenant</strong><span>Every member makes the guild stronger.</span></p>
          </div>
        </aside>
      </div>

      {editingSlot && (
        canManage && (
        <SearchPicker
          onChoose={chooseItem}
          onClose={() => setEditingSlot(null)}
          options={itemOptions}
          title={`Replace ${editingSlot}`}
        />
        )
      )}
      {isSkillPickerOpen && (
        canManage && (
        <SearchPicker
          onChoose={addSkill}
          onClose={() => setIsSkillPickerOpen(false)}
          options={availableSkills}
          title="Add a skill"
        />
        )
      )}
    </section>
  )
}
