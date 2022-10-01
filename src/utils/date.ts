import { timeRegexPattern } from "./const.js"

export const getCurrentTime = () => {
  const dateStr = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  //Fixing daylight saving time bug for now
  // now.setHours(now.getHours() - 1)

  return new Date(dateStr)
}

export const validateTimeFormat = (time: string) => {
  let matches = timeRegexPattern.exec(time)
  if (!matches) return [false, null] as const

  return [true, matches] as const
}
