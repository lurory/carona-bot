import { User } from 'node-telegram-bot-api'
import { specialUsers } from './const.js'

export const strikeThrough = (text: string): string => `<s>${text}</s>`

// Function to zero pad hour or minute strings
export const addZeroPadding = (time: number): string =>
  time < 10 ? String(time).padStart(2, '0') : time.toString()

export const getUserEmoji = (user: User): string => {
  return user.username ? specialUsers.get(user.username) || '' : ''
}

export const getSpecialDayEmoji = (day: number, month: number): string => {
  //Christmas
  if (month === 12) {
    //New year
    if (day === 31) return '\u{1F386} '
    return '\u{1F385} \u{1F384} '
  }
  //Vacation
  if (month === 1) return '\u{1F3D6} '
  //Halloween
  if (day === 31 && month === 10) return '\u{1F383} '

  return ''
}

export const compareValues = (a: string | number | Date, b: string | number | Date): number => {
  if (isString(a) && isString(b)) {
    return b.localeCompare(a)
  }

  return a === b ? 0 : a > b ? 1 : -1
}

const isString = (x: any): x is string => typeof x === 'string'
