const token = process.env.TOKEN;

const Bot = require('node-telegram-bot-api');
let bot;

if(process.env.NODE_ENV === 'production') {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
}
else {
  bot = new Bot(token, { polling: true });
}

console.log('Bot server started in the ' + process.env.NODE_ENV + ' mode');

bot.on('text', (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;

  const fields = msg.text.split(' ');
  command = fields[0];

  bot.sendMessage(chatId, 'Received message: ' + msg.text);

  switch(command) {
    case '/ida':
      // Message format:
      // /ida [time] [description]

      // se nao tem nenhuma carona da pessoa pra ida ou pra volta
      // pode criar pro dia seguinte, e se tem, é porque nao passou do horario, pq
      // nao foi deletada pelo programa
      if (fields.length < 3)
      {
        bot.sendMessage(chatId, '/ida [hoje?] [horário] [descrição]');
        return;
      }

      let isToday = false;
      let time;
      
      
      if (fields[1].trim() === "hoje")
      {
        isToday = true;
        time = fields[2];
      }
      else
        time = fields[1];
      
      const today = new Date();

      bot.sendMessage(chatId, 'Ida');
      break;
    case '/volta':
      // Message format:
      // /volta [time] [description]
      if (fields.length < 3)
        bot.sendMessage(chatId, '/volta [horário] [descrição]');

      bot.sendMessage(chatId, 'Volta');
      break;
    case '/lista':
      bot.sendMessage(chatId, 'Lista');
      break;
    case '/remover':
      bot.sendMessage(chatId, 'Remover');
      break;
    case '/data':
      bot.sendMessage(chatId, new Date().toLocaleString("pt-BR"));
      break;
    default:
      bot.sendMessage(chatId, 'Comando desconhecido');
  } 

  // send a message to the chat acknowledging receipt of their message
  // bot.sendMessage(chatId, 'Received your message');
});

module.exports = bot;
