import type { ReactNode } from 'react'

export type IconName =
  | 'activity' | 'arrowUpRight' | 'bell' | 'chevronDown' | 'chevronLeft'
  | 'chevronRight' | 'coins' | 'crest' | 'download' | 'grid' | 'more'
  | 'close' | 'copy' | 'plus' | 'search' | 'signal' | 'sliders' | 'sort' | 'swords' | 'trendUp'
  | 'trophy' | 'users'

const paths: Record<IconName, ReactNode> = {
  activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
  arrowUpRight: <><path d="M7 17 17 7M7 7h10v10" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  chevronDown: <><path d="m6 9 6 6 6-6" /></>,
  chevronLeft: <><path d="m15 18-6-6 6-6" /></>,
  chevronRight: <><path d="m9 18 6-6-6-6" /></>,
  coins: <><circle cx="8" cy="8" r="5" /><path d="M2 8v3a5 5 0 0 0 9.5 2M8 5v6m-2-4h3m5-2a5 5 0 0 1 5 5v4a5 5 0 0 1-9 3" /><path d="M15 10v7m-2-5h4" /></>,
  crest: <><path d="M12 2 4.5 5v6.2c0 5 3.2 8.5 7.5 10.8 4.3-2.3 7.5-5.8 7.5-10.8V5L12 2Z" /><path d="m8 13 2.5 2.5L16 9" /></>,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5m-5 5V3" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  plus: <><path d="M12 5v14m-7-7h14" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  signal: <><path d="M2 20h.01M7 20v-4m5 4v-8m5 8V8m5 12V4" /></>,
  sliders: <><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M2 14h4m4-6h4m4 8h4" /></>,
  sort: <><path d="m8 9 4-4 4 4m0 6-4 4-4-4" /></>,
  swords: <><path d="m14.5 17.5 3 3L22 16l-3-3m-7-1 6-6 3 3-6 6m-9 8 3-3m-3 3 3 3m-3-3 6-6m0 0L6 3 3 6l6 6" /></>,
  trendUp: <><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  trophy: <><path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 7H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 10v-2a4 4 0 0 0-3-3.87m-1-11.13a4 4 0 0 1 0 7.75" /></>,
}

export function Icon({ name }: { name: IconName }) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}
