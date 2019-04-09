const fs = require('fs')

class RideManager 
{
	constructor (filepath)
	{
		this.filepath = filepath;

		this.rides;

		fs.readFile(this.filepath, (err, data) => {  
		if (err) 
		{
			if (err.code === 'ENOENT') // File does not exist
			{
				this.rides = {}
				return;
			}
			throw err;
		}
		this.rides = JSON.parse(data);
		console.log(JSON.stringify(this.rides, null, 2));
		});
	}

	addRide(chatId, user, time, description, direction)
	{
		let isEdit = false;
		if (!this.rides.hasOwnProperty(chatId))
		{
			this.rides[chatId] = {};
			this.rides[chatId]['going'] = {};
			this.rides[chatId]['coming'] = {};
		}
		else if (this.rides[chatId][direction].hasOwnProperty(user.id))
			isEdit = true;
		
		this.rides[chatId][direction][user.id] = {
			'user': user,
			'time': time,
			'description': description
		};

		this.updateFile();

		// console.log(JSON.stringify(this.rides, null, 2));
		// console.log(isEdit);

		return isEdit;

		
	}

	removeRide(chatId, userId, direction)
	{
		if (!this.rides[chatId][direction].hasOwnProperty(userId))
			return false;

		delete this.rides[chatId][direction][userId];

		this.updateFile();

		// console.log(JSON.stringify(this.rides, null, 2))

		return true;
	}

	clean(chatId)
	{
		if (!this.rides.hasOwnProperty(chatId))
		{
			this.rides[chatId] = {};
			this.rides[chatId]['going'] = {};
			this.rides[chatId]['coming'] = {};
			return;
		}

		let now = new Date().toLocaleString("pt-BR", {"timeZone": "America/Sao_Paulo"});
		now = new Date(now);
		let removed = false;
		for (const direction of Object.keys(this.rides[chatId]))
			for (const [userId, ride] of Object.entries(this.rides[chatId][direction]))
				if (new Date(ride.time) < now)
				{
					// console.log('Removing ride of ' + ride.user.first_name + ' at ' + ride.time)
					removed = true;
					delete this.rides[chatId][direction][userId];
				}
		if (removed == true)
			this.updateFile();
	}

	updateFile()
	{
		fs.writeFile(this.filepath, JSON.stringify(this.rides), function (err) {
			if (err)  console.log(err);
		});
	}
};

module.exports = RideManager;