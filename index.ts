import 'dotenv/config'
import * as bot from './src/bot.js'
import web from './src/web.js'

process.title = 'caronaBot'
web(bot)
