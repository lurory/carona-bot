const Const = require('./const.js')
const Utils = require("./utils.js")

const fs = require('fs')

class RideManager {
	constructor(filepath) {
		this.filepath = filepath

		this.rides

		fs.readFile(this.filepath, (err, data) => {
			if (err) {
				if (err.code === 'ENOENT') // File does not exist
				{
					this.rides = {}
					return
				}
				throw err
			}
			this.rides = JSON.parse(data)
			console.log(JSON.stringify(this.rides, null, 2))
		})
	}

	// Add/edit a ride and save to the file. Returns `true`
	// if the ride was edited and `false` if it was created.
	addRide(chatId, user, time, description, direction) {
		let isEdit = false
		if (!this.rides.hasOwnProperty(chatId)) {
			this.rides[chatId] = {}
			this.rides[chatId]['going'] = {}
			this.rides[chatId]['coming'] = {}
		}
		else if (this.rides[chatId][direction].hasOwnProperty(user.id))
			isEdit = true

		this.rides[chatId][direction][user.id] = {
			'user': user,
			'time': time,
			'description': description,
			'direction': direction,
			'full': 0
		}

		this.updateFile()
		return isEdit
	}

	// Remove a ride and update the file. Returns `false` if there 
	// isn't such a ride to be removed.
	removeRide(chatId, userId, direction) {
		if (!this.rides[chatId][direction].hasOwnProperty(userId))
			return false

		delete this.rides[chatId][direction][userId]

		this.updateFile()
		return true
	}

	// Set ride full (`state` = 1) or empty (`state` = 0)
	// and update the file.
	setRideFull(chatId, userId, direction, state) {
		if (!this.rides[chatId][direction].hasOwnProperty(userId))
			return false

		this.rides[chatId][direction][userId].full = state
		this.updateFile()
		return true
	}

	// Clean past rides and update the file.
	clean(chatId) {
		if (!this.rides.hasOwnProperty(chatId)) {
			this.rides[chatId] = {}
			this.rides[chatId]['going'] = {}
			this.rides[chatId]['coming'] = {}
			return
		}

		let now = new Date().toLocaleString("pt-BR", { "timeZone": "America/Sao_Paulo" })
		now = new Date(now)
		let removed = false
		for (const direction of Object.keys(this.rides[chatId]))
			for (const [userId, ride] of Object.entries(this.rides[chatId][direction]))
				if (new Date(ride.time) < now) {
					removed = true
					delete this.rides[chatId][direction][userId]
				}
		if (removed == true)
			this.updateFile()
	}

	// Function to update the file with the `rides` attribute content.
	updateFile() {
		fs.writeFile(this.filepath, JSON.stringify(this.rides), function (err) {
			if (err) console.log(err)
		})
	}

	// Returns a string ready to be sent to the users
	// with all the rides information.
	listRidesAsString(chatId) {
		let totalRides = []
		let message

		// No rides
		if (!this.rides.hasOwnProperty(chatId))
			return ""

		// Concatenate rides arrays to a single array
		Object.entries(this.rides[chatId]).forEach(element => {
			const rides = Object.values(element[1])
			totalRides = totalRides.concat(rides)
		})

		//Sorting by day/month - direction - time
		totalRides.sort((a, b) => {
			let dateA = new Date(a.time)
			let dateB = new Date(b.time)
			let timeA = Utils.addZeroPadding(dateA.getHours())
				+ ":" + Utils.addZeroPadding(dateA.getMinutes())
			let timeB = Utils.addZeroPadding(dateB.getHours())
				+ ":" + Utils.addZeroPadding(dateB.getMinutes())

			return (dateA.toDateString()).localeCompare(dateB.toDateString()) ||
				(b.direction).localeCompare(a.direction) ||
				(timeA).localeCompare(timeB)
		})

		// Auxiliary variables
		message = ""
		let date, hours, minutes, day, month, weekday
		let previousDirection, previousDate
		let rideInfo
		let changedDate = false

		// Assemble the message while iterating over the
		// rides array
		totalRides.forEach(ride => {
			date = new Date(ride.time)
			hours = date.getHours()
			minutes = date.getMinutes()
			day = date.getDate()
			month = date.getMonth() + 1
			weekday = Const.weekdays.pt_br[date.getDay()]

			// Check if day/month changed to print a new line
			if (!previousDate || previousDate != date.toDateString()) {
				// changedDate = true
				if (previousDate)
					message += "\n"
				message += Utils.getSpecialDayEmoji(day, month) + "*" + (day < 10 ? "0" + day : day)
					+ "/"
					+ (month < 10 ? "0" + month : month)
					+ " - " + weekday + "* " + Const.emojis[date.getDay()]
					+ "\n"
			}

			// Check if direction changed to print a new line and the new direction
			if (!previousDirection || previousDirection != ride.direction) {
				message += '\n'
				message += (ride.direction === "going") ? "*IDA*\n" : "*VOLTA*\n"
			}

			// Ride info (time and description)
			rideInfo = " - " + (hours < 10 ? "0" + hours : hours) + ":"
				+ (minutes != 0 ? minutes : '00') + " - "
				+ ride.description

			// If it is full, generate strikethrough text.
			if (ride.full === 1) {
				rideInfo = ride.user.first_name + " "
					+ (ride.user.last_name || "")
					+ rideInfo
				message += Utils.strikeThrough(rideInfo) + "\n"
			}
			// If it is not, create a link for the user.
			else {
				rideInfo = (Utils.getUserEmoji(ride.user)) + " "
					+ "[" + ride.user.first_name + " " + (ride.user.last_name || "") + "]"
					+ "(tg://user?id=" + ride.user.id + ")"
					+ rideInfo
				message += rideInfo + "\n"
			}

			previousDirection = ride.direction
			previousDate = date.toDateString()
		})

		// Return the full message.
		return message
	}
}

module.exports = RideManager