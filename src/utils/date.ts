import { timeRegexPattern } from './const.js'

export const getCurrentTime = () => {
  const dateStr = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  //Fixing daylight saving time bug for now
  // now.setHours(now.getHours() - 1)

  return new Date(dateStr)
}

export const parseHoursMinutes = (time: string) => {
  let matches = timeRegexPattern.exec(time)
  if (!matches) return null

  return { hours: parseInt(matches[1]), minutes: parseInt(matches[2]) } as const
}
