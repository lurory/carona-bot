const token = process.env.TOKEN

const Bot = require('node-telegram-bot-api')

const RideManager = require('./rideManager.js')
const Utils = require("./utils.js")

let bot

if (process.env.NODE_ENV === 'production') {
  bot = new Bot(token)
  bot.setWebHook(process.env.HEROKU_URL + bot.token)
}
else {
  bot = new Bot(token, { polling: true })
}

console.log('Bot server started in the ' + process.env.NODE_ENV + ' mode')

rideManager = new RideManager()

bot.on('text', (msg) => {
  if (msg.text[0] != "/")
    return

  const chatId = msg.chat.id
  const user = msg.from

  const fields = msg.text.split(' ')
  command = fields[0]

  if (command.indexOf('@carona_v2_bot') > -1)
    command = command.split('@')[0]

  let message

  switch (command) {
    case '/ida':
    case '/volta':
      if (fields.length < 3) {
        bot.sendMessage(chatId, command + ' [horário] [descrição]')
        return
      }

      let todayFlag = false
      let timePattern = /^([01]?[0-9]|2[0-3])[:h]?([0-5][0-9])?$/
      let now, time, matches
      let description

      if (fields[1].trim() === "hoje") {
        todayFlag = true
        time = fields[2]
        description = fields.slice(3, fields.length).join(' ')
      }
      else {
        time = fields[1]
        description = fields.slice(2, fields.length).join(' ')
      }

      // Validating time format
      matches = timePattern.exec(time)
      if (!matches) {
        bot.sendMessage(chatId, 'Horário no formato inválido, utilize 10, 10h, 10:15, 10h15.\nEx: ' + command + ' 10h Largo do Bicão', {
          'reply_to_message_id': msg.message_id,
        })
        return
      }

      // Clean old rides
      rideManager.clean(chatId)

      // Get current time
      now = new Date().toLocaleString("pt-BR", { "timeZone": "America/Sao_Paulo" })
      now = new Date(now)

      // Setting date according to the ride time
      time = new Date(now.getTime())
      time.setHours(parseInt(matches[1]))
      if (matches[2])
        time.setMinutes(parseInt(matches[2]))
      else
        time.setMinutes(0)

      // If the "today" flag is not present and the ride hour/minute is before
      // the current time.
      if (!todayFlag && time < now)
        time.setDate(time.getDate() + 1)


      let isEdit = rideManager.addRide(chatId, user, time, description,
        command === '/ida' ? 'going' : 'coming')

      if (isEdit === true)
        bot.sendMessage(chatId, 'Sua ' + command.slice(1) + ' foi atualizada.',
          {
            'reply_to_message_id': msg.message_id,
            'parse_mode': 'Markdown'
          })
      else
        bot.sendMessage(chatId, 'Sua ' + command.slice(1) + ' foi adicionada com sucesso.',
          {
            'reply_to_message_id': msg.message_id,
            'parse_mode': 'Markdown'
          })

      // List the rides after adding a new one
      message = rideManager.listRidesAsString(chatId)
      if (message != "")
        bot.sendMessage(chatId, message, { 'parse_mode': 'Markdown' })
      else
        bot.sendMessage(chatId, 'Nenhuma carona cadastrada até o momento.', { 'parse_mode': 'Markdown' })
      break

    case '/lotou':
    case '/vagou':
      if (fields.length < 2 || (fields[1] != "ida" && fields[1] != "volta")) {
        bot.sendMessage(chatId, command + ' ida/volta')
        return
      }
      let success = rideManager.setRideFull(chatId, user.id,
        fields[1] === 'ida' ? 'going' : 'coming',
        command === '/lotou' | 0)
      if (success === true)
        bot.sendMessage(chatId,
          'Estado da sua carona de ' + fields[1] + ' alterado.',
          { 'reply_to_message_id': msg.message_id })
      else
        bot.sendMessage(chatId,
          user.first_name + ', você não possui uma ' + fields[1] + ' cadastrada.',
          { 'reply_to_message_id': msg.message_id })
      break

    case '/lista':
      // Clean old rides
      rideManager.clean(chatId)
      message = rideManager.listRidesAsString(chatId)
      if (message != "")
        bot.sendMessage(chatId, message, { 'parse_mode': 'Markdown' })
      else
        bot.sendMessage(chatId, 'Nenhuma carona cadastrada até o momento.', { 'parse_mode': 'Markdown' })
      break

    case '/remover':
      if (fields.length < 2 || (fields[1] != "ida" && fields[1] != "volta")) {
        bot.sendMessage(chatId, command + ' ida/volta')
        return
      }

      if (rideManager.removeRide(chatId, user.id, fields[1] === 'ida' ? 'going' : 'coming')) {
        bot.sendMessage(chatId, 'Sua ' + fields[1] + ' foi removida.',
          { 'reply_to_message_id': msg.message_id })

        // List the rides after removing one of them
        message = rideManager.listRidesAsString(chatId)
        if (message != "")
          bot.sendMessage(chatId, message, { 'parse_mode': 'Markdown' })
        else
          bot.sendMessage(chatId, 'Nenhuma carona cadastrada até o momento.', { 'parse_mode': 'Markdown' })
      }
      else
        bot.sendMessage(chatId,
          user.first_name + ', você não possui uma ' + fields[1] + ' cadastrada.',
          { 'reply_to_message_id': msg.message_id })

      break

    case '/limpar':
      rideManager.clean(chatId)
      break

    case '/help':
    case '/ajuda':
      bot.sendMessage(chatId, Utils.getHelpMessage(), {
        'parse_mode': 'Markdown'
      })
      break

    default:
      bot.sendMessage(chatId, 'Desculpe, não entendi. Digite /ajuda para ver a lista de comandos.')
  }
})

bot.on('polling_error', (error) => {
  console.log(error)
  console.log(error.code)  // => 'EFATAL'
})

module.exports = bot