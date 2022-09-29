import { specialUsers } from './const.js'
import { User } from 'node-telegram-bot-api'

export const strikeThrough = (text: string): string => `<s>${text}</s>`

// Function to zero pad hour or minute strings
export const addZeroPadding = (time: number): string =>
    time < 10 ? 
    String(time).padStart(2, '0') : 
    time.toString()

export const getUserEmoji = (user: User): string => {
  return user.username ? specialUsers.get(user.username) || '' : ''
}

export const getSpecialDayEmoji = (day: number, month: number): string => {
  //Easter
  if (month === 4 && (day === 17 || day === 18 || day === 19 || day === 20 || day === 21))
    return '\u{1F430}'
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
