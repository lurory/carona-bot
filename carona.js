class Carona 
{
	constructor (chatId, user, time, description)
	{
        this.chatId = chatId;
		this.user = user;
		this.time = time;
		this.description = description;
		console.log ('Created Carona object');
	}
};

module.exports = Carona;