MONGO_URL = 'mongodb+srv://' + process.env.MONGO_USER + ':' + process.env.MONGO_PASSW +
            '@cluster0-bnobp.mongodb.net/test?retryWrites=true&w=majority'

// Weekdays names
const weekdays = 
{
    pt_br: [
        "Domingo",
        "Segunda",
        "Terça",
        "Quarta",
        "Quinta",
        "Sexta",
        "Sábado"
    ],
    en_us: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ]
}

// Emojis for each weekday
const emojis = [
    "\u{1F62B}",
    "\u{1F62D}",
    "\u{1F610}",
    "\u{1F914}",
    "\u{1F60F}",
    "\u{1F604} \u{1F37B}",
    "\u{1F631}"
]

const admin_users = [
    146544127, // Lucas
    173433762  // Fabiana
]

module.exports = {
    MONGO_URL,
    weekdays,
    emojis,
    admin_users
}