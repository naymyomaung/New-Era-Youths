import type { GuildMember } from './members'

export type GearSlot =
  | 'Bag'
  | 'Main hand'
  | 'Off hand'
  | 'Head'
  | 'Armor'
  | 'Shoes'
  | 'Cape'
  | 'Food'
  | 'Potion'
  | 'Mount'

export type GearItem = {
  slot: GearSlot
  name: string
  itemId: string | null
  tier: number
}

export type CatalogItem = GearItem & {
  itemId: string
}

export type SkillKey = 'Q' | 'W' | 'E' | 'Passive'

export type GuildSkill = {
  id: string
  key: SkillKey
  name: string
}

export type MemberBuild = {
  gear: GearItem[]
  skills: GuildSkill[]
}

const equipmentSeeds: Array<Omit<CatalogItem, 'tier'>> = [
  { slot: 'Bag', name: 'Adventurer’s Bag', itemId: 'T4_BAG' },
  { slot: 'Bag', name: 'Collector’s Bag', itemId: 'T4_BAG_INSURANCE' },
  { slot: 'Main hand', name: 'Battleaxe', itemId: 'T4_2H_AXE' },
  { slot: 'Main hand', name: 'Axe', itemId: 'T4_MAIN_AXE' },
  { slot: 'Main hand', name: 'Halberd', itemId: 'T4_2H_HALBERD' },
  { slot: 'Main hand', name: 'Great Holy Staff', itemId: 'T4_2H_HOLYSTAFF' },
  { slot: 'Main hand', name: 'Holy Staff', itemId: 'T4_MAIN_HOLYSTAFF' },
  { slot: 'Main hand', name: 'Wild Staff', itemId: 'T4_2H_NATURESTAFF' },
  { slot: 'Main hand', name: 'Druidic Staff', itemId: 'T4_MAIN_NATURESTAFF' },
  { slot: 'Main hand', name: 'Heavy Mace', itemId: 'T4_MAIN_MACE' },
  { slot: 'Main hand', name: 'Dagger Pair', itemId: 'T4_2H_DAGGERPAIR' },
  { slot: 'Main hand', name: 'Dagger', itemId: 'T4_MAIN_DAGGER' },
  { slot: 'Main hand', name: 'Longbow', itemId: 'T4_2H_BOW' },
  { slot: 'Main hand', name: 'Warbow', itemId: 'T4_2H_WARBOW' },
  { slot: 'Main hand', name: 'Broadsword', itemId: 'T4_MAIN_SWORD' },
  { slot: 'Main hand', name: 'Claymore', itemId: 'T4_2H_CLAYMORE' },
  { slot: 'Main hand', name: 'Crossbow', itemId: 'T4_2H_CROSSBOW' },
  { slot: 'Main hand', name: 'Frost Staff', itemId: 'T4_MAIN_FROSTSTAFF' },
  { slot: 'Main hand', name: 'Great Frost Staff', itemId: 'T4_2H_FROSTSTAFF' },
  { slot: 'Main hand', name: 'Cursed Staff', itemId: 'T4_MAIN_CURSEDSTAFF' },
  { slot: 'Main hand', name: 'Great Cursed Staff', itemId: 'T4_2H_CURSEDSTAFF' },
  { slot: 'Main hand', name: 'Hammer', itemId: 'T4_MAIN_HAMMER' },
  { slot: 'Main hand', name: 'Great Hammer', itemId: 'T4_2H_HAMMER' },
  { slot: 'Main hand', name: 'Spear', itemId: 'T4_MAIN_SPEAR' },
  { slot: 'Main hand', name: 'Pike', itemId: 'T4_2H_SPEAR' },
  { slot: 'Off hand', name: 'Torch', itemId: 'T4_OFF_TORCH' },
  { slot: 'Off hand', name: 'Shield', itemId: 'T4_OFF_SHIELD' },
  { slot: 'Off hand', name: 'Keeper’s Horn', itemId: 'T4_OFF_HORN_KEEPER' },
  { slot: 'Off hand', name: 'Tome of Spells', itemId: 'T4_OFF_BOOK' },
  { slot: 'Off hand', name: 'Sarcophagus', itemId: 'T4_OFF_TOWERSHIELD_UNDEAD' },
  { slot: 'Head', name: 'Hunter Hood', itemId: 'T4_HEAD_LEATHER_SET2' },
  { slot: 'Head', name: 'Stalker Hood', itemId: 'T4_HEAD_LEATHER_SET3' },
  { slot: 'Head', name: 'Scholar Cowl', itemId: 'T4_HEAD_CLOTH_SET1' },
  { slot: 'Head', name: 'Cleric Cowl', itemId: 'T4_HEAD_CLOTH_SET2' },
  { slot: 'Head', name: 'Druid Cowl', itemId: 'T4_HEAD_CLOTH_SET3' },
  { slot: 'Head', name: 'Soldier Helmet', itemId: 'T4_HEAD_PLATE_SET1' },
  { slot: 'Head', name: 'Knight Helmet', itemId: 'T4_HEAD_PLATE_SET2' },
  { slot: 'Head', name: 'Judicator Helmet', itemId: 'T4_HEAD_PLATE_SET3' },
  { slot: 'Head', name: 'Miner Cap', itemId: 'T4_HEAD_GATHERER_ORE' },
  { slot: 'Head', name: 'Harvester Cap', itemId: 'T4_HEAD_GATHERER_FIBER' },
  { slot: 'Head', name: 'Skinner Cap', itemId: 'T4_HEAD_GATHERER_HIDE' },
  { slot: 'Armor', name: 'Mercenary Jacket', itemId: 'T4_ARMOR_LEATHER_SET1' },
  { slot: 'Armor', name: 'Hunter Jacket', itemId: 'T4_ARMOR_LEATHER_SET2' },
  { slot: 'Armor', name: 'Assassin Jacket', itemId: 'T4_ARMOR_LEATHER_SET3' },
  { slot: 'Armor', name: 'Scholar Robe', itemId: 'T4_ARMOR_CLOTH_SET1' },
  { slot: 'Armor', name: 'Cleric Robe', itemId: 'T4_ARMOR_CLOTH_SET2' },
  { slot: 'Armor', name: 'Druid Robe', itemId: 'T4_ARMOR_CLOTH_SET3' },
  { slot: 'Armor', name: 'Soldier Armor', itemId: 'T4_ARMOR_PLATE_SET1' },
  { slot: 'Armor', name: 'Knight Armor', itemId: 'T4_ARMOR_PLATE_SET2' },
  { slot: 'Armor', name: 'Guardian Armor', itemId: 'T4_ARMOR_PLATE_SET3' },
  { slot: 'Armor', name: 'Miner Garb', itemId: 'T4_ARMOR_GATHERER_ORE' },
  { slot: 'Armor', name: 'Harvester Garb', itemId: 'T4_ARMOR_GATHERER_FIBER' },
  { slot: 'Armor', name: 'Skinner Garb', itemId: 'T4_ARMOR_GATHERER_HIDE' },
  { slot: 'Shoes', name: 'Scholar Sandals', itemId: 'T4_SHOES_CLOTH_SET1' },
  { slot: 'Shoes', name: 'Cleric Sandals', itemId: 'T4_SHOES_CLOTH_SET2' },
  { slot: 'Shoes', name: 'Mage Sandals', itemId: 'T4_SHOES_CLOTH_SET3' },
  { slot: 'Shoes', name: 'Soldier Boots', itemId: 'T4_SHOES_PLATE_SET1' },
  { slot: 'Shoes', name: 'Knight Boots', itemId: 'T4_SHOES_PLATE_SET2' },
  { slot: 'Shoes', name: 'Guardian Boots', itemId: 'T4_SHOES_PLATE_SET3' },
  { slot: 'Shoes', name: 'Royal Sandals', itemId: 'T4_SHOES_CLOTH_ROYAL' },
  { slot: 'Shoes', name: 'Miner Workboots', itemId: 'T4_SHOES_GATHERER_ORE' },
  { slot: 'Shoes', name: 'Harvester Workboots', itemId: 'T4_SHOES_GATHERER_FIBER' },
  { slot: 'Shoes', name: 'Skinner Workboots', itemId: 'T4_SHOES_GATHERER_HIDE' },
  { slot: 'Mount', name: 'Riding Horse', itemId: 'T4_MOUNT_HORSE' },
  { slot: 'Mount', name: 'Armored Horse', itemId: 'T4_MOUNT_ARMORED_HORSE' },
  { slot: 'Mount', name: 'Direwolf', itemId: 'T4_MOUNT_DIREWOLF' },
  { slot: 'Mount', name: 'Swamp Dragon', itemId: 'T4_MOUNT_SWAMPDRAGON' },
  { slot: 'Mount', name: 'Mammoth', itemId: 'T4_MOUNT_MAMMOTH' },
  { slot: 'Cape', name: 'Cape', itemId: 'T4_CAPE' },
  { slot: 'Food', name: 'Beef Stew', itemId: 'T4_MEAL_STEW' },
  { slot: 'Potion', name: 'Healing Potion', itemId: 'T4_POTION_HEAL' },
]

const tierNames: Record<number, string> = {
  4: 'Adept',
  5: 'Expert',
  6: 'Master',
  7: 'Grandmaster',
  8: 'Elder',
}

export const itemCatalog: CatalogItem[] = equipmentSeeds.flatMap((seed) =>
  [4, 5, 6, 7, 8].map((tier) => ({
    ...seed,
    itemId: seed.itemId.replace(/^T4_/, `T${tier}_`),
    tier,
  })),
)

export const skillCatalog: GuildSkill[] = [
  { id: 'rending-strike', key: 'Q', name: 'Rending Strike' },
  { id: 'deadly-chop', key: 'Q', name: 'Deadly Chop' },
  { id: 'holy-flash', key: 'Q', name: 'Holy Flash' },
  { id: 'generous-heal', key: 'Q', name: 'Generous Heal' },
  { id: 'rejuvenation', key: 'Q', name: 'Rejuvenation' },
  { id: 'thorns', key: 'Q', name: 'Thorns' },
  { id: 'threatening-smash', key: 'Q', name: 'Threatening Smash' },
  { id: 'deadly-swipe', key: 'Q', name: 'Deadly Swipe' },
  { id: 'deadly-shot', key: 'Q', name: 'Deadly Shot' },
  { id: 'frost-shot', key: 'Q', name: 'Frost Shot' },
  { id: 'adrenaline-boost', key: 'W', name: 'Adrenaline Boost' },
  { id: 'battle-rush', key: 'W', name: 'Battle Rush' },
  { id: 'holy-orb', key: 'W', name: 'Holy Orb' },
  { id: 'revitalize', key: 'W', name: 'Revitalize' },
  { id: 'shadow-edge', key: 'W', name: 'Shadow Edge' },
  { id: 'ray-of-light', key: 'W', name: 'Ray of Light' },
  { id: 'frost-nova', key: 'W', name: 'Frost Nova' },
  { id: 'blood-bandit', key: 'E', name: 'Blood Bandit' },
  { id: 'air-compressor', key: 'E', name: 'Air Compressor' },
  { id: 'holy-beam', key: 'E', name: 'Holy Beam' },
  { id: 'circle-of-inspiration', key: 'E', name: 'Circle of Inspiration' },
  { id: 'rain-of-arrows', key: 'E', name: 'Rain of Arrows' },
  { id: 'chain-slash', key: 'E', name: 'Chain Slash' },
  { id: 'deep-cuts', key: 'Passive', name: 'Deep Cuts' },
  { id: 'aggressive-caster', key: 'Passive', name: 'Aggressive Caster' },
  { id: 'toughness', key: 'Passive', name: 'Toughness' },
  { id: 'balanced-mind', key: 'Passive', name: 'Balanced Mind' },
  { id: 'energetic', key: 'Passive', name: 'Energetic' },
]

const defaultSkillIds: Record<string, string[]> = {
  holy: ['holy-flash', 'holy-orb', 'holy-beam', 'aggressive-caster'],
  nature: ['rejuvenation', 'revitalize', 'circle-of-inspiration', 'energetic'],
  mace: ['threatening-smash', 'battle-rush', 'air-compressor', 'toughness'],
  dagger: ['deadly-swipe', 'shadow-edge', 'chain-slash', 'deep-cuts'],
  bow: ['deadly-shot', 'frost-shot', 'rain-of-arrows', 'balanced-mind'],
}

function itemById(itemId: string, slot: GearSlot, name: string): GearItem {
  const found = itemCatalog.find((item) => item.itemId === itemId)
  return found ?? { itemId, slot, name, tier: 4 }
}

export function createSuggestedBuild(member: GuildMember): MemberBuild {
  const specialty = member.specialty.toLowerCase()
  let weapon = itemById('T4_2H_AXE', 'Main hand', 'Battleaxe')
  let offHand = itemById('T4_OFF_TORCH', 'Off hand', 'Torch')
  let head = itemById('T4_HEAD_LEATHER_SET2', 'Head', 'Hunter Hood')
  let armor = itemById('T4_ARMOR_LEATHER_SET1', 'Armor', 'Mercenary Jacket')
  let shoes = itemById('T4_SHOES_PLATE_SET1', 'Shoes', 'Soldier Boots')

  if (specialty.includes('holy')) {
    weapon = itemById('T4_2H_HOLYSTAFF', 'Main hand', 'Great Holy Staff')
    offHand = itemById('T4_OFF_HORN_KEEPER', 'Off hand', 'Keeper’s Horn')
    head = itemById('T4_HEAD_CLOTH_SET2', 'Head', 'Cleric Cowl')
    armor = itemById('T4_ARMOR_CLOTH_SET2', 'Armor', 'Cleric Robe')
    shoes = itemById('T4_SHOES_CLOTH_SET1', 'Shoes', 'Scholar Sandals')
  } else if (specialty.includes('nature')) {
    weapon = itemById('T4_2H_NATURESTAFF', 'Main hand', 'Wild Staff')
    offHand = itemById('T4_OFF_HORN_KEEPER', 'Off hand', 'Keeper’s Horn')
    head = itemById('T4_HEAD_CLOTH_SET3', 'Head', 'Druid Cowl')
    armor = itemById('T4_ARMOR_CLOTH_SET3', 'Armor', 'Druid Robe')
    shoes = itemById('T4_SHOES_CLOTH_SET1', 'Shoes', 'Scholar Sandals')
  } else if (specialty.includes('mace') || specialty.includes('shields')) {
    weapon = itemById('T4_MAIN_MACE', 'Main hand', 'Heavy Mace')
    offHand = itemById('T4_OFF_TOWERSHIELD_UNDEAD', 'Off hand', 'Sarcophagus')
    head = itemById('T4_HEAD_PLATE_SET3', 'Head', 'Judicator Helmet')
    armor = itemById('T4_ARMOR_PLATE_SET3', 'Armor', 'Guardian Armor')
  } else if (specialty.includes('dagger')) {
    weapon = itemById('T4_2H_DAGGERPAIR', 'Main hand', 'Dagger Pair')
    head = itemById('T4_HEAD_LEATHER_SET3', 'Head', 'Stalker Hood')
    armor = itemById('T4_ARMOR_LEATHER_SET3', 'Armor', 'Assassin Jacket')
    shoes = itemById('T4_SHOES_CLOTH_ROYAL', 'Shoes', 'Royal Sandals')
  } else if (specialty.includes('bow')) {
    weapon = itemById('T4_2H_BOW', 'Main hand', 'Longbow')
    offHand = itemById('T4_OFF_HORN_KEEPER', 'Off hand', 'Keeper’s Horn')
    head = itemById('T4_HEAD_LEATHER_SET3', 'Head', 'Assassin Hood')
  } else if (specialty.includes('ore')) {
    weapon = { slot: 'Main hand', name: 'Miner Pickaxe', itemId: null, tier: 4 }
    offHand = { slot: 'Off hand', name: 'Gathering Backpack', itemId: null, tier: 4 }
    head = itemById('T4_HEAD_GATHERER_ORE', 'Head', 'Miner Cap')
    armor = itemById('T4_ARMOR_GATHERER_ORE', 'Armor', 'Miner Garb')
    shoes = itemById('T4_SHOES_GATHERER_ORE', 'Shoes', 'Miner Workboots')
  } else if (specialty.includes('fiber')) {
    weapon = { slot: 'Main hand', name: 'Harvester Sickle', itemId: null, tier: 4 }
    offHand = { slot: 'Off hand', name: 'Gathering Backpack', itemId: null, tier: 4 }
    head = itemById('T4_HEAD_GATHERER_FIBER', 'Head', 'Harvester Cap')
    armor = itemById('T4_ARMOR_GATHERER_FIBER', 'Armor', 'Harvester Garb')
    shoes = itemById('T4_SHOES_GATHERER_FIBER', 'Shoes', 'Harvester Workboots')
  } else if (specialty.includes('hide')) {
    weapon = { slot: 'Main hand', name: 'Skinning Knife', itemId: null, tier: 4 }
    offHand = { slot: 'Off hand', name: 'Gathering Backpack', itemId: null, tier: 4 }
    head = itemById('T4_HEAD_GATHERER_HIDE', 'Head', 'Skinner Cap')
    armor = itemById('T4_ARMOR_GATHERER_HIDE', 'Armor', 'Skinner Garb')
    shoes = itemById('T4_SHOES_GATHERER_HIDE', 'Shoes', 'Skinner Workboots')
  } else if (specialty.includes('armor')) {
    weapon = itemById('T4_MAIN_SWORD', 'Main hand', 'Broadsword')
    offHand = itemById('T4_OFF_SHIELD', 'Off hand', 'Shield')
    head = itemById('T4_HEAD_CLOTH_SET1', 'Head', 'Scholar Cowl')
    armor = itemById('T4_ARMOR_CLOTH_SET1', 'Armor', 'Scholar Robe')
    shoes = itemById('T4_SHOES_CLOTH_SET1', 'Shoes', 'Scholar Sandals')
  }

  const cape = itemById('T4_CAPE', 'Cape', 'Cape')
  const food = itemById('T4_MEAL_STEW', 'Food', 'Beef Stew')
  const skillSet = Object.entries(defaultSkillIds).find(([key]) => specialty.includes(key))?.[1] ??
    ['rending-strike', 'adrenaline-boost', 'blood-bandit', 'deep-cuts']

  return {
    gear: [
      itemById('T4_BAG', 'Bag', 'Adventurer’s Bag'),
      weapon,
      offHand,
      head,
      armor,
      shoes,
      itemById('T4_POTION_HEAL', 'Potion', 'Healing Potion'),
      cape,
      food,
      itemById('T4_MOUNT_HORSE', 'Mount', 'Riding Horse'),
    ],
    skills: skillSet.flatMap((id) => {
      const skill = skillCatalog.find((option) => option.id === id)
      return skill ? [skill] : []
    }),
  }
}

export function getTierLabel(tier: number): string {
  return `Tier ${tier} · ${tierNames[tier] ?? 'Adept'}’s`
}

export function isMemberBuild(value: unknown): value is MemberBuild {
  if (typeof value !== 'object' || value === null) return false
  const build = value as Record<string, unknown>
  if (!Array.isArray(build.gear) || !Array.isArray(build.skills)) return false
  const validSlots: GearSlot[] = [
    'Bag', 'Main hand', 'Off hand', 'Head', 'Armor', 'Shoes', 'Mount', 'Cape', 'Food', 'Potion',
  ]

  return build.gear.every((item: unknown) =>
    typeof item === 'object' &&
    item !== null &&
    validSlots.includes((item as GearItem).slot) &&
    typeof (item as GearItem).name === 'string' &&
    ((item as GearItem).itemId === null || typeof (item as GearItem).itemId === 'string') &&
    typeof (item as GearItem).tier === 'number',
  ) && build.skills.every((skill: unknown) =>
    typeof skill === 'object' &&
    skill !== null &&
    typeof (skill as GuildSkill).id === 'string' &&
    typeof (skill as GuildSkill).key === 'string' &&
    typeof (skill as GuildSkill).name === 'string',
  )
}
