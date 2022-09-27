import 'dotenv/config'
import * as bot from './src/bot'
import web from './src/web'

process.title = 'caronaBot'
web(bot)
