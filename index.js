require("dotenv").config()

process.title = "caronaBot"

var bot = require('./bot')
require('./web')(bot)