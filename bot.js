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

bot.on('inline_query', (msg) => {
  const query = msg.query;
  let resultValue = limitedEval(query)
  const results = [
    {
      type: 'article',
      id: '0',
      title: 'Inline Calculator Bot',
      description: query,
      input_message_content: {message_text: query + ' = ' + resultValue}
    }
  ]
  bot.answerInlineQuery(msg.id, JSON.stringify(results)).then(() => {});
});

module.exports = bot;
