export type MemberRole = 'Guild Master' | 'Officer' | 'Veteran' | 'Member'

export type GuildMember = {
  id: string
  name: string
  role: MemberRole
  specialty: string
  fame: string
  lastActive: string
  online: boolean
  avatar: string
  avatarTone: 'ember' | 'violet' | 'blue' | 'sage' | 'gold' | 'rose'
}

export const initialMembers: GuildMember[] = [
  { id: '1', name: 'IronWarden', role: 'Guild Master', specialty: 'Shot Caller', fame: '184.2M', lastActive: 'Online now', online: true, avatar: 'IW', avatarTone: 'gold' },
  { id: '2', name: 'LunaVex', role: 'Officer', specialty: 'Healer · Holy', fame: '142.8M', lastActive: 'Online now', online: true, avatar: 'LV', avatarTone: 'violet' },
  { id: '3', name: 'GrimHollow', role: 'Officer', specialty: 'Tank · Maces', fame: '126.5M', lastActive: 'Online now', online: true, avatar: 'GH', avatarTone: 'ember' },
  { id: '4', name: 'AshenFang', role: 'Veteran', specialty: 'DPS · Axes', fame: '98.1M', lastActive: 'Online now', online: true, avatar: 'AF', avatarTone: 'rose' },
  { id: '5', name: 'Thornweaver', role: 'Veteran', specialty: 'Healer · Nature', fame: '86.4M', lastActive: 'Online now', online: true, avatar: 'TW', avatarTone: 'sage' },
  { id: '6', name: 'RookAndRuin', role: 'Veteran', specialty: 'Gatherer · Ore', fame: '74.9M', lastActive: '2 hours ago', online: false, avatar: 'RR', avatarTone: 'blue' },
  { id: '7', name: 'VelvetDagger', role: 'Member', specialty: 'DPS · Daggers', fame: '63.2M', lastActive: '5 hours ago', online: false, avatar: 'VD', avatarTone: 'violet' },
  { id: '8', name: 'Mossbound', role: 'Member', specialty: 'Gatherer · Fiber', fame: '48.7M', lastActive: 'Yesterday', online: false, avatar: 'MB', avatarTone: 'sage' },
  { id: '9', name: 'CinderVale', role: 'Member', specialty: 'Crafter · Armor', fame: '39.3M', lastActive: 'Yesterday', online: false, avatar: 'CV', avatarTone: 'ember' },
  { id: '10', name: 'Oathkeeper', role: 'Member', specialty: 'Tank · Shields', fame: '28.6M', lastActive: '2 days ago', online: false, avatar: 'OK', avatarTone: 'gold' },
  { id: '11', name: 'BlueMorrow', role: 'Member', specialty: 'Gatherer · Hide', fame: '16.8M', lastActive: '3 days ago', online: false, avatar: 'BM', avatarTone: 'blue' },
  { id: '12', name: 'QuietTempest', role: 'Member', specialty: 'DPS · Bows', fame: '9.4M', lastActive: '4 days ago', online: false, avatar: 'QT', avatarTone: 'rose' },
]
