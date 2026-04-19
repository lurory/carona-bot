import { timeRegexPattern } from './const.js'

/** All ride times are interpreted and shown in this zone (users are in Brazil). */
export const USER_TIME_ZONE = 'America/Sao_Paulo'

type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

const zonedPartsFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

const readPart = (parts: Intl.DateTimeFormatPart[], type: string) =>
  Number(parts.find((p) => p.type === type)?.value ?? 'NaN')

/** Wall-clock fields for `date` when viewed in `timeZone` (e.g. Brasília). */
export const getZonedParts = (date: Date, timeZone: string = USER_TIME_ZONE): ZonedParts => {
  const parts = zonedPartsFormatter(timeZone).formatToParts(date)
  return {
    year: readPart(parts, 'year'),
    month: readPart(parts, 'month'),
    day: readPart(parts, 'day'),
    hour: readPart(parts, 'hour'),
    minute: readPart(parts, 'minute'),
    second: readPart(parts, 'second')
  }
}

/** BRT = UTC−3 (no DST since 2019 in Brazil — revisit if rules change). */
const BRT_OFFSET_HOURS = 3

/** Civil date/time in Brasília → UTC instant (the `Date` Mongo persists). */
export const brasiliaLocalToUtc = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date => new Date(Date.UTC(year, month - 1, day, hour + BRT_OFFSET_HOURS, minute, 0))

/** YYYYMMDD in the user zone — for sorting/grouping by calendar day. */
export const zonedDateSortKey = (date: Date, timeZone: string = USER_TIME_ZONE): number => {
  const p = getZonedParts(date, timeZone)
  return p.year * 10000 + p.month * 100 + p.day
}

const EN_WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const

/** 0 = Sunday … 6 = Saturday, for the civil calendar day containing `date` in `timeZone`. */
export const getWeekdayIndexInZone = (date: Date, timeZone: string = USER_TIME_ZONE): number => {
  const w = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).formatToParts(date)
  const label = w.find((p) => p.type === 'weekday')?.value
  const idx = EN_WEEKDAY_LONG.indexOf(label as (typeof EN_WEEKDAY_LONG)[number])
  if (idx < 0) throw new Error(`Unexpected weekday label: ${label}`)
  return idx
}

/** Gregorian calendar (y, m, d) plus `deltaDays` — same calendar Brazil uses. */
export const addCalendarDays = (
  year: number,
  month: number,
  day: number,
  deltaDays: number
): [number, number, number] => {
  const x = new Date(Date.UTC(year, month - 1, day + deltaDays))
  return [x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()]
}

export const validateTimeFormat = (time: string) => {
  let matches = timeRegexPattern.exec(time)
  if (!matches) return [false, null] as const

  return [true, matches] as const
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
