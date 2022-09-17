export const strikeThrough = (text: string): string => {
  return `<s>${text}</s>`
}

// Function to zero pad hour or minute strings
export const addZeroPadding = (time: number): string => {
  if (time < 10) return '0' + time.toString()
  return time.toString()
}

export const getUserLink = (id: string, name: string, lastName: string): string =>
  `<a href="tg://user?id=${id}">` + name + ' ' + (lastName || '') + '</a>'

// TODO: Get correct types for Telegra user
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

export const getHelpMessage = (): string => {
  return (
    'Olá! Sou o Carona Bot v2.0!\n\n' +
    '/lista - Lista as caronas registradas.\n' +
    '/ida <b>[horário] [descrição]</b> - Adiciona sua ida para o horário especificado. Se você já possuir uma ida, ela será atualizada.\n<b>Ex: /ida 7:30 Vila da Penha</b>\n' +
    '/volta <b>[horário] [descrição]</b> - Adiciona sua volta para o horário especificado. Se você já possuir uma volta, ela será atualizada.\n<b>Ex: /volta 17 Largo do Bicão</b>\n' +
    '/remover <b>ida</b>/<b>volta</b> - Remove sua ida ou volta, dependendo da opção escolhida. <b>Ex: /remover ida</b>\n' +
    '/lotou <b>ida</b>/<b>volta</b> - Marca a sua carona de ida ou volta como lotada, dependendo da opção escolhida. <b>Ex: /lotou volta</b>\n' +
    '/vagou <b>ida</b>/<b>volta</b> - Marca a sua carona de ida ou volta como disponível, dependendo da opção escolhida. <b>Ex: /vagou ida</b>\n' +
    '/help ou /ajuda - Exibe essa mensagem.\n\n' +
    `Criado por ${getUserLink('173433762', 'Fabiana', 'Ferreira')} e ${getUserLink(
      '146544127',
      'Lucas',
      'Cerqueira'
    )}.`
  )
}
