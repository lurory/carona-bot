import Bot from 'node-telegram-bot-api'

import { adminUsers } from './const.js'
import { validateTimeFormat } from './date.js'
import { createFullRideMessage, getWrongTimeFormatMessage } from './messages.js'
import bot from '../src/bot.js'

export const parseFieldsFromMessage = (message: string) => {
  const [command, ...params] = message.split(' ')
  return { command: getPureCommand(command), params }
}

export const handleNewRide = async (
  command: string,
  chatId: number,
  messageId: number,
  user: Bot.User,
  now: Date,
  options: Array<string>
) => {
  if (options.length < 2) {
    bot.telegram.sendMessage(
      chatId,
      `Para cadastrar sua ${command.slice(1)}, digite: \n ${command} [horário] [descrição]`
    )
    return
  }

  const [isToday, time, description] = getRideInfo(options)
  const [isTimeFormatValid, rideTime] = validateTimeFormat(time)

  if (!isTimeFormatValid) {
    bot.telegram.sendMessage(chatId, getWrongTimeFormatMessage(command), {
      reply_to_message_id: messageId
    })
    return
  }

  const rideDate = setRideDateAndTime(now, rideTime, isToday)

  let wasModified = await bot.manager.addRide(chatId, {
    user,
    time: rideDate,
    description,
    direction: command === '/ida' ? 'going' : 'coming'
  })

  if (!wasModified)
    bot.telegram.sendMessage(chatId, 'Sua ' + command.slice(1) + ' foi atualizada.', {
      reply_to_message_id: messageId
    })
  else
    bot.telegram.sendMessage(chatId, 'Sua ' + command.slice(1) + ' foi adicionada com sucesso.', {
      reply_to_message_id: messageId
    })

  bot.manager.listRidesAsString(chatId).then((msg: string) => {
    msg != ''
      ? bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML' })
      : bot.telegram.sendMessage(chatId, 'Nenhuma carona cadastrada até o momento.')
  })
}

export const handleExistingRide = async (
  command: string,
  chatId: number,
  messageId: number,
  user: Bot.User,
  options: Array<string>
) => {
  if (options.length < 1 || (options[0] != 'ida' && options[0] != 'volta')) {
    bot.telegram.sendMessage(chatId, command + ' ida/volta')
    return
  }

  const [direction] = options

  let success = await bot.manager.setRideFull(chatId, {
    userId: user.id,
    direction: options[0] === 'ida' ? 'going' : 'coming',
    state: command === '/lotou' ? 1 : 0
  })

  const replyMsg = createFullRideMessage(success, {
    direction,
    userFirstName: user?.first_name
  })

  bot.telegram.sendMessage(chatId, replyMsg, {
    reply_to_message_id: messageId
  })
}

export const listRides = async (chatId: number, now: Date) => {
  // Clean old rides
  await bot.manager.cleanRides(chatId, now)

  bot.manager.listRidesAsString(chatId).then((msg: string) => {
    msg != ''
      ? bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML' })
      : bot.telegram.sendMessage(chatId, 'Nenhuma carona cadastrada até o momento.')
  })
}

export const handleRemoveRide = async (
  command: string,
  chatId: number,
  messageId: number,
  user: Bot.User,
  options: Array<string>
) => {
  if (options.length < 1 || (options[0] != 'ida' && options[0] != 'volta')) {
    bot.telegram.sendMessage(chatId, command + ' ida/volta')
    return
  }

  const [direction] = options

  if (
    await bot.manager.removeRide(chatId, {
      userId: user.id,
      direction: direction === 'ida' ? 'going' : 'coming'
    })
  ) {
    bot.telegram.sendMessage(chatId, `Sua ${direction} foi removida.`, {
      reply_to_message_id: messageId
    })

    bot.manager.listRidesAsString(chatId).then((msg: string) => {
      msg != ''
        ? bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML' })
        : bot.telegram.sendMessage(chatId, 'Nenhuma carona cadastrada até o momento.')
    })
  } else
    bot.telegram.sendMessage(
      chatId,
      `${user.first_name}, você não possui uma ${direction} cadastrada.`,
      {
        reply_to_message_id: messageId
      }
    )
}

export const sendAdminMessageToGroup = async (user: Bot.User, params: Array<string>) => {
  if (adminUsers.includes(user.id)) {
    const groupId = params[1]
    bot.telegram.sendMessage(groupId, params.slice(2, params.length).join(' '))
  }
}

const getPureCommand = (command: string) => {
  if (command.indexOf('@carona_v2_bot') > -1) {
    return command.split('@')[0].toLowerCase()
  }
  return command.toLowerCase()
}

const setRideDateAndTime = (now: Date, rideTime: string[], isToday: boolean) => {
  let rideDateAndTime = new Date()
  rideDateAndTime.setSeconds(0)
  rideDateAndTime.setHours(parseInt(rideTime[1]))

  rideTime[2] ? rideDateAndTime.setMinutes(parseInt(rideTime[2])) : rideDateAndTime.setMinutes(0)

  // If the "today" flag is not present and the ride hour/minute is before
  // the current time.
  if (!isToday && rideDateAndTime < now) rideDateAndTime.setDate(rideDateAndTime.getDate() + 1)

  return rideDateAndTime
}

const getRideInfo = (fields: string[]) => {
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
