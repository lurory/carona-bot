import { timeRegexPattern } from './const'
export const registerRide = () => {}

export const getPureCommand = (command: string) => {
  if (command.indexOf('@carona_v2_bot') > -1) {
    return command.split('@')[0].toLowerCase()
  }
  return command.toLowerCase()
}

export const validateTimeFormat = (time: string) => {
  let matches = timeRegexPattern.exec(time)
  if (!matches) return [false, null] as const

  return [true, matches] as const
}

export const getRideInfo = (fields: string[]) => {
  let isToday = false
  let time
  let description

  if (fields[1].trim() === 'hoje') {
    isToday = true
    time = fields[2]
    description = fields.slice(3, fields.length).join(' ')
  } else {
    time = fields[1]
    description = fields.slice(2, fields.length).join(' ')
  }

  return [isToday, time, description] as const
}

export const setRideDateAndTime = (now: Date, rideTime: string[], isToday: boolean) => {
  let dateWithTime = new Date(now.getTime())
  dateWithTime.setSeconds(0)
  dateWithTime.setHours(parseInt(rideTime[1]))

  rideTime[2] ? dateWithTime.setMinutes(parseInt(rideTime[2])) : dateWithTime.setMinutes(0)

  if (!isToday && dateWithTime < now) dateWithTime.setDate(dateWithTime.getDate() + 1)

  return dateWithTime
}

export const getUserLink = (id: number, name: string, lastName: string): string =>
  `<a href="tg://user?id=${id}">` + name + ' ' + (lastName || '') + '</a>'

export const getWrongTimeFormatMessage = (command: string): string => {
  return (
    'Horário no formato inválido, utilize 10, 10h, 10:15, 10h15.\nEx: ' +
    command +
    ' 10h Largo do Bicão'
  )
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

export const createFullRideMessage = (
  wasSuccessful: boolean,
  params: { direction: string; userFirstName?: string }
) => {
  return wasSuccessful
    ? 'Estado da sua carona de ' + params.direction + ' alterado.'
    : ', você não possui uma ' + params.userFirstName + ' cadastrada.'
}
