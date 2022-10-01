import Bot from 'node-telegram-bot-api'

import { getRideInfo, parseFieldsFromMessage, setRideDateAndTime } from './utils/bot.js'
import RideManager from './rideManager.js'
import { getCurrentTime, validateTimeFormat } from './utils/date.js'
import {
  createFullRideMessage,
  getHelpMessage,
  getWrongTimeFormatMessage
} from './utils/messages.js'
import { adminUsers } from './utils/const.js'

let token: string
let tgBot: Bot

if (process.env.NODE_ENV === 'production') {
  token = process.env.TOKEN as string
  tgBot = new Bot(token)
  tgBot.setWebHook(process.env.HEROKU_URL + token)
} else {
  token = process.env.TOKEN_DEV as string
  tgBot = new Bot(token, { polling: true })
}

console.log('Bot server started in the ' + process.env.NODE_ENV + ' mode')

let rideManager = new RideManager()

tgBot.on('text', async (msg) => {
  if (!msg.text || msg.text[0] != '/') return

  const chatId = msg.chat.id
  const user = msg.from as Bot.User
  const messageId = msg.message_id
  const { command, params } = parseFieldsFromMessage(msg.text)
  const currentTime = getCurrentTime()

  switch (command) {
    case '/ida':
    case '/volta':
      await handleNewRide(command, chatId, messageId, user, currentTime, params)
      break

    case '/lotou':
    case '/vagou':
      await handleExistingRide(command, chatId, messageId, user, params)
      break

    case '/lista':
      await listRides(chatId)
      break

    case '/remover':
      await handleRemoveRide(command, chatId, messageId, user, params)
      break

    case '/help':
    case '/ajuda':
      tgBot.sendMessage(chatId, getHelpMessage(), { parse_mode: 'HTML' })
      break

    case '/say':
      sendAdminMessageToGroup(user, params)
      break

    default:
      tgBot.sendMessage(
        chatId,
        'Desculpe, não entendi. Digite /ajuda para ver a lista de comandos.'
      )
  }
})

tgBot.on('polling_error', (error: Error) => {
  console.log(error.message)
})

process.on('SIGINT', function () {
  console.log('SIGINT')
  rideManager.db.disconnect()
  process.exit()
})

process.on('SIGTERM', function () {
  console.log('SIGTERM')
  rideManager.db.disconnect()
  process.exit()
})

const handleNewRide = async (
  command: string,
  chatId: number,
  messageId: number,
  user: Bot.User,
  now: Date,
  options: Array<string>
) => {
  if (options.length < 2) {
    tgBot.sendMessage(
      chatId,
      `Para cadastrar sua ${command.slice(1)}, digite: \n ${command} [horário] [descrição]`
    )
    return
  }

  const [isToday, time, description] = getRideInfo(options)
  const [isTimeFormatValid, rideTime] = validateTimeFormat(time)

  if (!isTimeFormatValid) {
    tgBot.sendMessage(chatId, getWrongTimeFormatMessage(command), {
      reply_to_message_id: messageId
    })
    return
  }

  const rideDate = setRideDateAndTime(now, rideTime, isToday)

  let wasModified = await rideManager.addRide(chatId, {
    user,
    time: rideDate,
    description,
    direction: command === '/ida' ? 'going' : 'coming'
  })

  if (!wasModified)
    tgBot.sendMessage(chatId, 'Sua ' + command.slice(1) + ' foi atualizada.', {
      reply_to_message_id: messageId
    })
  else
    tgBot.sendMessage(chatId, 'Sua ' + command.slice(1) + ' foi adicionada com sucesso.', {
      reply_to_message_id: messageId
    })

  await listRides(chatId)
}

const handleExistingRide = async (
  command: string,
  chatId: number,
  messageId: number,
  user: Bot.User,
  options: Array<string>
) => {
  if (options.length < 1 || (options[0] != 'ida' && options[0] != 'volta')) {
    tgBot.sendMessage(chatId, command + ' ida/volta')
    return
  }

  const [direction] = options

  let success = await rideManager.setRideFull(chatId, {
    userId: user.id,
    direction: options[0] === 'ida' ? 'going' : 'coming',
    state: command === '/lotou' ? 1 : 0
  })

  const replyMsg = createFullRideMessage(success, {
    direction,
    userFirstName: user?.first_name
  })

  tgBot.sendMessage(chatId, replyMsg, {
    reply_to_message_id: messageId
  })

  await listRides(chatId)
}

const listRides = async (chatId: number) => {
  const currentTime = getCurrentTime()
  await rideManager.cleanRides(chatId, currentTime)

  rideManager.listRidesAsString(chatId).then((msg: string) => {
    msg != ''
      ? tgBot.sendMessage(chatId, msg, { parse_mode: 'HTML' })
      : tgBot.sendMessage(chatId, 'Nenhuma carona cadastrada até o momento.')
  })
}

const handleRemoveRide = async (
  command: string,
  chatId: number,
  messageId: number,
  user: Bot.User,
  options: Array<string>
) => {
  if (options.length < 1 || (options[0] != 'ida' && options[0] != 'volta')) {
    tgBot.sendMessage(chatId, command + ' ida/volta')
    return
  }

  const [direction] = options

  if (
    await rideManager.removeRide(chatId, {
      userId: user.id,
      direction: direction === 'ida' ? 'going' : 'coming'
    })
  ) {
    tgBot.sendMessage(chatId, `Sua ${direction} foi removida.`, {
      reply_to_message_id: messageId
    })

    await listRides(chatId)
  } else
    tgBot.sendMessage(chatId, `${user.first_name}, você não possui uma ${direction} cadastrada.`, {
      reply_to_message_id: messageId
    })
}

const sendAdminMessageToGroup = async (user: Bot.User, params: Array<string>) => {
  if (adminUsers.includes(user.id)) {
    const groupId = params[1]
    tgBot.sendMessage(groupId, params.slice(2, params.length).join(' '))
  }
}

export default tgBot
