import Bot from 'node-telegram-bot-api'

import { Ride } from '../typings/ride.js'
import RideManager from './rideManager.js'
import { getRideInfo, parseFieldsFromMessage, setRideDateAndTime } from './utils/bot.js'
import { adminUsers } from './utils/const.js'
import { sleep, validateTimeFormat } from './utils/date.js'
import {
  createFullRideMessage,
  getHelpMessage,
  getWrongTimeFormatMessage
} from './utils/messages.js'

let token: string
let tgBot: Bot

if (process.env.NODE_ENV === 'production') {
  token = process.env.TOKEN as string
  tgBot = new Bot(token)
  tgBot.setWebHook(`${process.env.APP_URL}/bot${token}`)
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
  switch (command) {
    case '/ida':
    case '/volta':
      await handleNewRide(command, chatId, messageId, user, new Date(), params)
      break

    case '/lotou':
    case '/vagou':
      await handleExistingRide(command, chatId, messageId, user, params)
      break

    case '/lista':
      await cleanRides(chatId)
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
      await broadcastAdminMessage(user, chatId, params)
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

  await cleanRides(chatId)

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

  await sleep(1500)
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

  const groupRides = await cleanRides(chatId)
  const [direction] = options
  const directionField = direction === 'ida' ? 'going' : 'coming'

  let success: boolean

  const userRideInDirection = groupRides.filter(
    (ride: Ride) => ride.user.id === user.id && ride.direction === directionField
  )
  if (userRideInDirection.length) {
    success = await rideManager.setRideFull(chatId, {
      userId: user.id,
      direction: directionField,
      state: command === '/lotou' ? 1 : 0
    })
  } else {
    success = false
  }

  const replyMsg = createFullRideMessage(success, {
    direction,
    userFirstName: user.first_name
  })

  tgBot.sendMessage(chatId, replyMsg, {
    reply_to_message_id: messageId
  })

  if (success) {
    await sleep(1500)
    await listRides(chatId)
  }
}

const listRides = async (chatId: number) =>
  await rideManager.listRidesAsString(chatId).then((msg: string) => {
    msg != ''
      ? tgBot.sendMessage(chatId, msg, { parse_mode: 'HTML' })
      : tgBot.sendMessage(chatId, 'Nenhuma carona cadastrada até o momento.')
  })

const cleanRides = async (chatId: number) => rideManager.cleanRides(chatId, new Date())

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

  await cleanRides(chatId)

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

    await sleep(1500)
    await listRides(chatId)
  } else
    tgBot.sendMessage(chatId, `${user.first_name}, você não possui uma ${direction} cadastrada.`, {
      reply_to_message_id: messageId
    })
}

const broadcastAdminMessage = async (
  user: Bot.User,
  adminChatId: number,
  params: Array<string>
) => {
  const safeReplyToAdmin = async (message: string) => {
    try {
      await tgBot.sendMessage(adminChatId, message)
    } catch (e) {
      console.log(`Broadcast: could not reach admin chat ${adminChatId}:`, e)
    }
  }

  try {
    if (!adminUsers.includes(user.id)) return

    const text = params.join(' ').trim()
    if (!text) {
      await safeReplyToAdmin('Digite a mensagem após /say.')
      return
    }

    let chatIds: number[]
    try {
      chatIds = await rideManager.getAllGroupChatIds()
    } catch (e) {
      console.log('Broadcast: failed to load group chat IDs:', e)
      await safeReplyToAdmin('Não foi possível carregar a lista de grupos.')
      return
    }

    if (chatIds.length === 0) {
      await safeReplyToAdmin('Nenhum grupo cadastrado no banco ainda.')
      return
    }

    let ok = 0
    let failed = 0
    for (const gid of chatIds) {
      try {
        await tgBot.sendMessage(gid, text)
        ok++
      } catch (err) {
        failed++
        console.log(`Broadcast failed for chat ${gid}:`, err)
      }
    }

    await safeReplyToAdmin(
      `Enviado para ${ok} grupo(s).` + (failed > 0 ? ` Falhou em ${failed}.` : '')
    )
  } catch (unexpected) {
    console.log('Broadcast: unexpected error:', unexpected)
    await safeReplyToAdmin('Broadcast encontrou um erro inesperado. Verifique os logs.')
  }
}

export { tgBot, token }
