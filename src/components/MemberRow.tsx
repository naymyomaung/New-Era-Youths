import type { GuildMember, MemberRole } from '../data/members'
import { Icon } from './Icon'

const roleClass: Record<MemberRole, string> = {
  'Guild Master': 'master',
  Officer: 'officer',
  Veteran: 'veteran',
  Member: 'member',
}

export function MemberRow({
  member,
  onSelect,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  member: GuildMember
  onSelect: () => void
  canEdit: boolean
  canDelete: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <tr>
      <td>
        <div className="member-identity">
          <button className="member-open" onClick={onSelect} type="button" aria-label={`View ${member.name} details`}>
            <span className={`member-avatar ${member.avatarTone}`}>{member.avatar}</span>
            <span className="member-name-wrap">
              <strong>{member.name}</strong>
              <span className="member-status">
                <i className={member.online ? 'online' : ''} />
                {member.online ? 'Online' : 'Offline'}
              </span>
            </span>
          </button>
        </div>
      </td>
      <td><span className={`role-badge ${roleClass[member.role]}`}>{member.role}</span></td>
      <td><span className="specialty">{member.specialty}</span></td>
      <td><span className="fame-value"><Icon name="swords" /> {member.fame}</span></td>
      <td><span className={`last-active${member.online ? ' active-now' : ''}`}>{member.lastActive}</span></td>
      <td>
        <div className="member-row-actions">
          <button className="row-menu" onClick={onSelect} type="button" aria-label={`Open ${member.name} profile`}><Icon name="arrowUpRight" /></button>
          {canEdit && <button className="row-menu" onClick={onEdit} type="button" aria-label={`Edit ${member.name}`}><Icon name="more" /></button>}
          {canDelete && <button className="member-delete-button" onClick={onDelete} type="button" aria-label={`Delete ${member.name}`}>Delete</button>}
        </div>
      </td>
    </tr>
  )
}
