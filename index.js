require("dotenv").config()

process.title = "caronaBot"

var bot = require('./src/bot')
require('./src/web')(bot)