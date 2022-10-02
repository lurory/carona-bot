import 'dotenv/config'
import { tgBot } from './src/bot.js'
import web from './src/web.js'

process.title = 'caronaBot'
web(tgBot)
