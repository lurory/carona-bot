import {
  createFullRideMessage,
  getPureCommand,
  getRideInfo,
  getWrongTimeFormatMessage,
  setRideDateAndTime,
  validateTimeFormat
} from '../utils/bot.js'
import Bot from 'node-telegram-bot-api'
import { adminUsers } from '../utils/const.js'
import { getHelpMessage } from '../utils/bot.js'
import RideManager from './rideManager.js'

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

  const fields = msg.text.split(' ')
  const command = getPureCommand(fields[0])
  const chatId = msg.chat.id
  const user = msg.from as Bot.User

  // Get current time
  const dateStr = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  const now = new Date(dateStr)
  //Fixing daylight saving time bug for now
  // now.setHours(now.getHours() - 1)

  switch (command) {
    case '/ida':
    case '/volta':
      if (fields.length < 3) {
        tgBot.sendMessage(
          chatId,
          `Para cadastrar sua ${command.slice(1)}, digite: \n ${command} [horário] [descrição]`
        )
        return
      }

      const [isToday, time, description] = getRideInfo(fields)
      const [isTimeFormatValid, rideTime] = validateTimeFormat(time)

      if (!isTimeFormatValid) {
        tgBot.sendMessage(chatId, getWrongTimeFormatMessage(command), {
          reply_to_message_id: msg.message_id
        })
        return
      }

      // Clean old rides
      // rideManager.clean(chatId, now)

      const rideDate = setRideDateAndTime(now, rideTime, isToday)

      let wasModified = await rideManager.addRide(chatId, {
        user,
        time: rideDate,
        description,
        direction: command === '/ida' ? 'going' : 'coming'
      })

      if (!wasModified)
        tgBot.sendMessage(chatId, 'Sua ' + command.slice(1) + ' foi atualizada.', {
          reply_to_message_id: msg.message_id
        })
      else
        tgBot.sendMessage(chatId, 'Sua ' + command.slice(1) + ' foi adicionada com sucesso.', {
          reply_to_message_id: msg.message_id
        })

      rideManager.listRidesAsString(chatId).then((msg: string) => {
        msg != ''
          ? tgBot.sendMessage(chatId, msg, { parse_mode: 'HTML' })
          : tgBot.sendMessage(chatId, 'Nenhuma carona cadastrada até o momento.')
      })

      break
    case '/lotou':
    case '/vagou':
      if (fields.length < 2 || (fields[1] != 'ida' && fields[1] != 'volta')) {
        tgBot.sendMessage(chatId, command + ' ida/volta')
        return
      }
      let success = await rideManager.setRideFull(chatId, {
        userId: user.id,
        direction: fields[1] === 'ida' ? 'going' : 'coming',
        state: command === '/lotou' ? 1 : 0
      })

      const replyMsg = createFullRideMessage(success, {
        direction: fields[1],
        userFirstName: user?.first_name
      })

      tgBot.sendMessage(chatId, replyMsg, {
        reply_to_message_id: msg.message_id
      })
      break

    case '/lista':
      // Clean old rides
      await rideManager.cleanRides(chatId, now)

      rideManager.listRidesAsString(chatId).then((msg: string) => {
        msg != ''
          ? tgBot.sendMessage(chatId, msg, { parse_mode: 'HTML' })
          : tgBot.sendMessage(chatId, 'Nenhuma carona cadastrada até o momento.')
      })

      break

    case '/remover':
      if (fields.length < 2 || (fields[1] != 'ida' && fields[1] != 'volta')) {
        tgBot.sendMessage(chatId, command + ' ida/volta')
        return
      }

      if (
        await rideManager.removeRide(chatId, {
          userId: user.id,
          direction: fields[1] === 'ida' ? 'going' : 'coming'
        })
      ) {
        tgBot.sendMessage(chatId, 'Sua ' + fields[1] + ' foi removida.', {
          reply_to_message_id: msg.message_id
        })

        rideManager.listRidesAsString(chatId).then((msg: string) => {
          msg != ''
            ? tgBot.sendMessage(chatId, msg, { parse_mode: 'HTML' })
            : tgBot.sendMessage(chatId, 'Nenhuma carona cadastrada até o momento.')
        })
      } else
        tgBot.sendMessage(
          chatId,
          user.first_name + ', você não possui uma ' + fields[1] + ' cadastrada.',
          { reply_to_message_id: msg.message_id }
        )

      break

    case '/limpar':
      //Used for debug
      // rideManager.clean(chatId, now)
      break

    case '/help':
    case '/ajuda':
      tgBot.sendMessage(chatId, getHelpMessage(), { parse_mode: 'HTML' })
      break

    case '/say':
      if (adminUsers.includes(user.id)) {
        const groupId = fields[1]
        tgBot.sendMessage(groupId, fields.slice(2, fields.length).join(' '))
      }
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

export default tgBot
