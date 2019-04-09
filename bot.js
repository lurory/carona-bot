const token = process.env.TOKEN;

const Bot = require('node-telegram-bot-api');
const fs = require('fs')

const Carona = require('./carona.js');

let bot;

if(process.env.NODE_ENV === 'production') {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
}
else {
  bot = new Bot(token, { polling: true });
}

console.log('Bot server started in the ' + process.env.NODE_ENV + ' mode');

var rides;

fs.readFile('rides.json', (err, data) => {  
  if (err) 
  {
    if (err.code === 'ENOENT') // File does not exist
    {
      rides = {}
      return;
    }
    throw err;
  }
  rides = JSON.parse(data);
  console.log(rides);
});

bot.on('text', (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;

  const fields = msg.text.split(' ');
  command = fields[0];

  let today;

  switch(command) {
    case '/ida':
    case '/volta':
      // Message format:
      // /ida [time] [description]

      // se nao tem nenhuma carona da pessoa pra ida ou pra volta
      // pode criar pro dia seguinte, e se tem, é porque nao passou do horario, pq
      // nao foi deletada pelo programa
      if (fields.length < 3)
      {
        bot.sendMessage(chatId, command + ' [hoje?] [horário] [descrição]');
        return;
      }

      let isToday = false;
      let timePattern = /^([01]?[0-9]|2[0-3])[:h]?([0-5][0-9])?$/;
      let time, matches;
      let description;
      
      if (fields[1].trim() === "hoje")
      {
        isToday = true;
        time = fields[2];
        description = fields.slice(3, fields.length).join(' ');
      }
      else
      {
        time = fields[1];
        description = fields.slice(2, fields.length).join(' ');
      }
      
      // Validating time format
      matches = timePattern.exec(time);
      if (!matches) 
      {
        bot.sendMessage(chatId, 'Horário no formato inválido');
        return;
      }

      // Setting date according to the ride time
      time = new Date().toLocaleString("pt-BR", {"timeZone": "America/Sao_Paulo"});
      time = new Date(time);
      time.setHours(parseInt(matches[1]));
      if (matches[2])
        time.setMinutes(parseInt(matches[2]));
      else
        time.setMinutes(0);
      // If it is for tomorrow, add one day to the date
      if (!isToday)
        time.setDate(time.getDate() + 1);

      // var carona = new Carona (user, time, description);

      bot.sendMessage(chatId, 'Ida ' + time.getHours() + ':' + ("0" + time.getMinutes()).slice(-2) +  ' - ' + description);

      console.log(time.toString());

      if (!rides.hasOwnProperty(chatId))
      {
        rides[chatId] = {};
        rides[chatId]['going'] = {};
        rides[chatId]['coming'] = {};
      }

      rides[chatId][command === '/ida' ? 'going' : 'coming'][user.id] = {
        'user': user,
        'time': time,
        'description': description
      };

      fs.writeFile('rides.json', JSON.stringify(rides), function (err) {
        if (err)  console.log(err);
      });

      console.log(JSON.stringify(rides, null, 2))

      break;
      
    case '/lista':
      bot.sendMessage(chatId, 'Lista');
      break;

    case '/remover':
      if (fields.length < 2 || (fields[1] != "ida" && fields[1] != "volta"))
      {
        bot.sendMessage(chatId, command + ' ida/volta');
        return;
      }

      delete rides[chatId][fields[1] === 'ida' ? 'going' : 'coming'][user.id];

      fs.writeFile('rides.json', JSON.stringify(rides), function (err) {
        if (err)  console.log(err);
      });

      console.log(JSON.stringify(rides, null, 2))

      break;

    default:
      bot.sendMessage(chatId, 'Comando desconhecido');
  } 

  // send a message to the chat acknowledging receipt of their message
  // bot.sendMessage(chatId, 'Received your message');
});

module.exports = bot;
