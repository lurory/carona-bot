import { timeRegexPattern } from './const.js'

export const getCurrentTime = () => {
  const d = new Date()

  //TODO: Remove hardcoded Brasilia timezone
  d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000 - 3 * 60 * 60 * 1000)
  return new Date(d)
}

export const validateTimeFormat = (time: string) => {
  let matches = timeRegexPattern.exec(time)
  if (!matches) return [false, null] as const

  return [true, matches] as const
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
