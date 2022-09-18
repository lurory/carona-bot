import * as bot from './src/bot'
import web from './src/web'
import * as dotenv from 'dotenv'

dotenv.config()
process.title = 'caronaBot'
web(bot)
