export const strikeThrough = (text: string): string => {
  return `<s>${text}</s>`
}

// Function to zero pad hour or minute strings
export const addZeroPadding = (time: number): string => {
  if (time < 10) return '0' + time.toString()
  return time.toString()
}

// TODO: Get correct types for Telegram user
export const getUserEmoji = (user: any) => {
  if (user.username === 'Mateus_Street') return '\u{1F697}'
  if (user.username === 'fabits') return '\u{1F994}'
  if (user.username === 'LucasCerqueira') return '\u{2618}'
  if (user.username === 'naruzete') return '\u{1F419}'
  return ''
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
