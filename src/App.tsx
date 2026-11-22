import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Icon } from './components/Icon'
import { MemberRow } from './components/MemberRow'
import { GuildRules } from './components/GuildRules'
import { GuildGuides } from './components/GuildGuides'
import { GuildBank } from './components/GuildBank'
import { GuildActivities } from './components/GuildActivities'
import { GuildMemberDialog } from './components/GuildMemberDialog'
import { AuthPages } from './components/AuthPages'
import { FunctionsHttpError } from '@supabase/supabase-js'
import {
  clearAuthSession,
  readAuthSession,
  toAuthUser,
  type AuthUser,
} from './data/authStorage'
import type { GuildMember, MemberRole } from './data/members'
import { useGuildRecords } from './data/useGuildRecords'
import type { GuildMemberRecord } from './data/guildData'
import { supabase } from './data/supabase'
import guildLogo from './assets/logo.jpg'
import supabaseIcon from './assets/supabase.svg'
import './App.css'
import { CreateBuild } from './components/CreateBuild'

type StatusFilter = 'All members' | 'Online' | 'Offline'

const navigation = [
  { label: 'Overview', icon: 'grid' },
  { label: 'Members', icon: 'users', active: true },
  { label: 'Invite link', icon: 'arrowUpRight', subLink: true },
  { label: 'Set build', icon: 'swords' },
  { label: 'Rules', icon: 'crest' },
  { label: 'Guides', icon: 'grid' },
  { label: 'Activities', icon: 'activity' },
  { label: 'Bank', icon: 'coins' },
] as const
const guildInviteCode = 'NEW-ERA-2026#7'

const roleOptions: Array<MemberRole | 'All roles'> = [
  'All roles',
  'Guild Master',
  'Officer',
  'Veteran',
  'Member',
]

const MemberDetails = lazy(() =>
  import('./components/MemberDetails').then((module) => ({ default: module.MemberDetails })),
)

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase && readAuthSession()))
  const [authError, setAuthError] = useState('')
  const [activePage, setActivePage] = useState<'Members' | 'Set build' | 'Rules' | 'Guides' | 'Activities' | 'Bank'>('Members')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteCopyStatus, setInviteCopyStatus] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<MemberRole | 'All roles'>('All roles')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All members')
  const [selectedMember, setSelectedMember] = useState<GuildMember | null>(null)
  const [editingMember, setEditingMember] = useState<GuildMemberRecord | null>(null)
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [memberActionError, setMemberActionError] = useState('')
  const memberData = useGuildRecords<GuildMemberRecord>('guild_members', Boolean(currentUser))
  const isRosterManager = currentUser?.role === 'Guild Master' || currentUser?.role === 'Officer'
  const isGuildMaster = currentUser?.role === 'Guild Master'
  const canManageData = Boolean(currentUser)
  const ownMemberId = currentUser
    ? memberData.records.find((member) =>
      member.name.normalize('NFKC').trim().toLocaleLowerCase('en-US') ===
      currentUser.gameName.normalize('NFKC').trim().toLocaleLowerCase('en-US'),
    )?.id ?? null
    : null
  const members = useMemo<GuildMember[]>(() => memberData.records.map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    specialty: member.specialty,
    fame: member.fame,
    lastActive: member.last_active,
    online: member.online,
    avatar: member.avatar,
    avatarTone: member.avatar_tone,
  })), [memberData.records])

  useEffect(() => {
    if (!supabase) return

    let active = true
    const sessionToken = readAuthSession()
    if (!sessionToken) return

    void supabase.functions.invoke<{ user: unknown }>('game-name-auth', {
      body: { action: 'session', sessionToken },
    }).then(({ data, error }) => {
      if (error) throw error
      const user = toAuthUser(data?.user)
      if (!user) throw new Error('The saved session is invalid.')
      if (active) setCurrentUser(user)
    }).catch(async (error: unknown) => {
      console.error('Unable to restore the custom authentication session.', error)
      let message = 'Unable to restore your sign-in session. Please try again.'
      if (error instanceof FunctionsHttpError) {
        if (error.context.status === 401) clearAuthSession()
        try {
          const response = await error.context.json() as { error?: unknown }
          if (typeof response.error === 'string') message = response.error
        } catch {
          if (error.context.status === 401) message = 'Your sign-in session expired. Please sign in again.'
        }
      } else if (error instanceof Error) {
        message = error.message
      }
      if (active) setAuthError(message)
    }).finally(() => {
      if (active) setAuthLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return members.filter((member) => {
      const matchesSearch =
        query.length === 0 ||
        member.name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.specialty.toLowerCase().includes(query)
      const matchesRole = roleFilter === 'All roles' || member.role === roleFilter
      const matchesStatus =
        statusFilter === 'All members' ||
        (statusFilter === 'Online' ? member.online : !member.online)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [members, roleFilter, search, statusFilter])

  if (authLoading) {
    return (
      <main className="auth-page">
        <div className="supabase-loading" role="status" aria-live="polite">
          <span className="supabase-loading-icon" aria-hidden="true">
            <img alt="" src={supabaseIcon} />
          </span>
          <span>Connecting to Supabase…</span>
        </div>
      </main>
    )
  }

  if (!supabase) {
    return <main className="auth-page"><section className="auth-card"><p className="auth-error" role="alert">Supabase is not configured. Add the project URL and anon key to .env.local, then restart the app.</p></section></main>
  }

  if (!currentUser) {
    return <AuthPages key={authError} initialError={authError} onAuthenticated={setCurrentUser} />
  }

  const userInitials = currentUser.gameName.slice(0, 2).toUpperCase()
  const signOut = async () => {
    try {
      const sessionToken = readAuthSession()
      if (supabase && sessionToken) {
        const { error } = await supabase.functions.invoke('game-name-auth', {
          body: { action: 'sign-out', sessionToken },
        })
        if (error) throw error
      }
    } catch (error) {
      console.error('Unable to sign out.', error)
      window.alert('Unable to revoke the session. It may remain active until it expires.')
    } finally {
      clearAuthSession()
      setCurrentUser(null)
    }
  }

  return (
    <main className={`app-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <a className="brand" href="#" aria-label="New Era Youths home">
            <span className="brand-mark"><img alt="" src={guildLogo} /></span>
            <span className="brand-copy">
              <strong>NEW ERA YOUTHS</strong>
            </span>
          </a>
          <button
            aria-expanded={!sidebarCollapsed}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            type="button"
          >
            <Icon name="chevronLeft" />
          </button>
        </div>

        <span className="nav-caption">GUILD MENU</span>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <a
              className={`nav-link${item.label === activePage ? ' active' : ''}${'subLink' in item && item.subLink ? ' sub-link' : ''}`}
              href="#"
              key={item.label}
              aria-current={item.label === activePage ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault()
                if (item.label === 'Invite link') {
                  setInviteCopyStatus('')
                  setInviteOpen(true)
                  return
                }
                if (item.label === 'Members' || item.label === 'Set build' || item.label === 'Rules' || item.label === 'Guides' || item.label === 'Activities' || item.label === 'Bank') {
                  setSelectedMember(null)
                  setActivePage(item.label)
                }
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === 'Members' && <span className="nav-count">{members.length}</span>}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="profile-button" onClick={signOut} type="button" aria-label="Sign out">
            <span className="profile-avatar">{userInitials}</span>
            <span className="profile-copy"><strong>{currentUser.gameName}</strong><small>{currentUser.role} · Sign out</small></span>
            <Icon name="more" />
          </button>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Guild</span><Icon name="chevronRight" />
            {activePage === 'Set build' ? (
              <strong>Set build</strong>
            ) : activePage === 'Rules' ? (
              <strong>Rules</strong>
            ) : activePage === 'Guides' ? (
              <strong>Guides</strong>
            ) : activePage === 'Activities' ? (
              <strong>Activities</strong>
            ) : activePage === 'Bank' ? (
              <strong>Bank</strong>
            ) : selectedMember ? (
              <>
                <button type="button" onClick={() => setSelectedMember(null)}>Members</button>
                <Icon name="chevronRight" /><strong>{selectedMember.name}</strong>
              </>
            ) : <strong>Members</strong>}
          </div>
          <div className="topbar-actions">
            <span className="sync-status"><span /> Synced just now</span>
            <button className="icon-button notification-button" type="button" aria-label="Notifications">
              <Icon name="bell" /><i />
            </button>
            <span className="topbar-divider" />
            <span className="user-mini-avatar">{userInitials}</span>
            <span className="topbar-user">{currentUser.gameName}</span>
            <Icon name="chevronDown" />
          </div>
        </header>

        <div className="page-content">
          {activePage === 'Set build' ? (
            <CreateBuild currentUser={currentUser} />
          ) : activePage === 'Rules' ? (
            <GuildRules canManage={canManageData} />
          ) : activePage === 'Guides' ? (
            <GuildGuides canManage={canManageData} />
          ) : activePage === 'Activities' ? (
            <GuildActivities canManage={canManageData} />
          ) : activePage === 'Bank' ? (
            <GuildBank canManage={canManageData} members={members} ownMemberId={ownMemberId} />
          ) : selectedMember ? (
            <Suspense fallback={<p className="details-loading" role="status">Loading member profile…</p>}>
              <MemberDetails
                canManage={selectedMember.id === ownMemberId}
                member={selectedMember}
                onBack={() => setSelectedMember(null)}
              />
            </Suspense>
          ) : (
            <>
          <section className="roster-section">
            <div className="roster-heading">
              <div>
                <h2>Member roster <span>{members.length}</span></h2>
                <p>Manage your guild members and their roles.</p>
              </div>
              <div className="roster-actions">
              {isRosterManager && <button className="invite-button" onClick={() => { setEditingMember(null); setMemberDialogOpen(true) }} type="button"><Icon name="plus" /> Add member</button>}
              <button
                className="export-button"
                type="button"
                onClick={() => {
                  const csv = [
                    'Character,Role,Specialty,Fame,Last active',
                    ...filteredMembers.map((member) =>
                      [member.name, member.role, member.specialty, member.fame, member.lastActive]
                        .map((value) => `"${value.replaceAll('"', '""')}"`)
                        .join(','),
                    ),
                  ].join('\n')
                  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
                  const link = document.createElement('a')
                  link.href = url
                  link.download = 'new-era-youths-members.csv'
                  link.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <Icon name="download" /> Export
              </button>
              </div>
            </div>
            {(memberData.error || memberActionError) && <p className="crud-error roster-error" role="alert">{memberData.error || memberActionError}</p>}

            <div className="roster-toolbar">
              <div className="filter-tabs" role="tablist" aria-label="Filter members by status">
                {(['All members', 'Online', 'Offline'] as const).map((filter) => (
                  <button
                    className={`filter-tab${statusFilter === filter ? ' selected' : ''}`}
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    role="tab"
                    aria-selected={statusFilter === filter}
                    type="button"
                  >
                    {filter === 'Online' && <i className="online-indicator" />}
                    {filter}
                    {filter === 'All members' && <span className="tab-count">{members.length}</span>}
                  </button>
                ))}
              </div>
              <div className="roster-tools">
                <label className="search-box">
                  <Icon name="search" />
                  <input
                    aria-label="Search members"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search members..."
                    type="search"
                    value={search}
                  />
                  <kbd>⌘ K</kbd>
                </label>
                <label className="role-select-wrap">
                  <Icon name="sliders" />
                  <select
                    aria-label="Filter by role"
                    onChange={(event) => setRoleFilter(event.target.value as MemberRole | 'All roles')}
                    value={roleFilter}
                  >
                    {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                  <Icon name="chevronDown" />
                </label>
                <button className="icon-button roster-settings" type="button" aria-label="Roster settings">
                  <Icon name="more" />
                </button>
              </div>
            </div>

            <div className="table-scroll">
              <table className="member-table">
                <thead>
                  <tr>
                    <th>MEMBER <Icon name="sort" /></th>
                    <th>ROLE</th>
                    <th>SPECIALTY</th>
                    <th>SEASON FAME <Icon name="sort" /></th>
                    <th>LAST ACTIVE</th>
                    <th><span className="sr-only">Member options</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      onSelect={() => setSelectedMember(member)}
                      canEdit={isGuildMaster || member.id === ownMemberId}
                      canDelete={isGuildMaster}
                      onEdit={() => {
                        const record = memberData.records.find((candidate) => candidate.id === member.id)
                        if (record) {
                          setEditingMember(record)
                          setMemberDialogOpen(true)
                        }
                      }}
                      onDelete={() => {
                        if (!window.confirm(`Delete "${member.name}"? This cannot be undone.`)) return
                        setMemberActionError('')
                        void memberData.remove(member.id).then(() => {
                          setSelectedMember((current) => current?.id === member.id ? null : current)
                        }).catch((error: unknown) => {
                          console.error('Unable to delete guild member.', error)
                          setMemberActionError(error instanceof Error ? error.message : 'Unable to delete this member.')
                        })
                      }}
                    />
                  ))}
                </tbody>
              </table>
              {filteredMembers.length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon"><Icon name="search" /></span>
                  {memberData.isLoading ? (
                    <strong>Loading guild members…</strong>
                  ) : (
                    <>
                      <strong>No members found</strong>
                      <span>Try another name or adjust your filters.</span>
                      <button type="button" onClick={() => { setSearch(''); setRoleFilter('All roles'); setStatusFilter('All members') }}>Clear filters</button>
                    </>
                  )}
                </div>
              )}
            </div>

            <footer className="table-footer">
              <span>Showing <strong>{filteredMembers.length === 0 ? 0 : 1}–{filteredMembers.length}</strong> of <strong>{members.length}</strong> members</span>
              <div><button type="button" disabled aria-label="Previous page"><Icon name="chevronLeft" /></button><button type="button" className="current-page">1</button><button type="button" disabled aria-label="Next page"><Icon name="chevronRight" /></button></div>
            </footer>
          </section>

          <footer className="page-footer"><span>© 2025 New Era Youths</span><span>Forged together. Unbroken forever.</span><a href="https://albiononline.com/" target="_blank" rel="noreferrer">Albion Online <Icon name="arrowUpRight" /></a></footer>
            </>
          )}
        </div>
      </section>
      {inviteOpen && (
        <div className="picker-backdrop" onMouseDown={() => setInviteOpen(false)}>
          <section
            aria-labelledby="invite-link-title"
            aria-modal="true"
            className="invite-link-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="picker-heading">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> NEW ERA YOUTHS</div>
                <h2 id="invite-link-title">Guild invite code</h2>
                <p>Share this fixed code with an adventurer you’d like to invite.</p>
              </div>
              <button aria-label="Close invite dialog" className="picker-close" onClick={() => setInviteOpen(false)} type="button">
                <Icon name="close" />
              </button>
            </div>
            <div className="invite-link-content">
              <label className="build-field">
                <span>Invite code</span>
                <input readOnly value={guildInviteCode} onFocus={(event) => event.currentTarget.select()} />
              </label>
              <p className="invite-link-note">This code stays the same: letters, numbers, and symbols only.</p>
              {inviteCopyStatus && <p className="invite-copy-status" role="status">{inviteCopyStatus}</p>}
              <div className="create-build-footer">
                <button className="build-cancel-button" onClick={() => setInviteOpen(false)} type="button">Close</button>
                <button
                  className="invite-button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(guildInviteCode)
                      setInviteCopyStatus('Invite code copied.')
                    } catch (error) {
                      console.error('Unable to copy the guild invite code.', error)
                      setInviteCopyStatus('Unable to copy code. Select it above and copy manually.')
                    }
                  }}
                  type="button"
                >
                  <Icon name="copy" /> Copy code
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      {memberDialogOpen && (
        <GuildMemberDialog
          member={editingMember}
          canEditProfile={!editingMember || (!isGuildMaster && editingMember.id === ownMemberId)}
          canEditRole={isGuildMaster}
          onClose={() => setMemberDialogOpen(false)}
          onSave={async (values) => {
            setMemberActionError('')
            if (editingMember) await memberData.update(editingMember.id, values)
            else await memberData.create(values)
          }}
        />
      )}
    </main>
  )
}

export default App
