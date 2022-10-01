import Bot from 'node-telegram-bot-api'

import {
  handleNewRide,
  parseFieldsFromMessage,
  handleExistingRide,
  listRides,
  handleRemoveRide,
  sendAdminMessageToGroup
} from '../utils/bot.js'
import RideManager from './rideManager.js'
import { getCurrentTime } from '../utils/date.js'
import { getHelpMessage } from '../utils/messages.js'

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

export default { telegram: tgBot, manager: rideManager }
