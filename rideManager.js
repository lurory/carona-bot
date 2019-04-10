const Const = require('./const.js')
const Utils = require("./utils.js")

const fs = require('fs')
const MongoClient = require('mongodb').MongoClient

class RideManager {
	constructor(filepath) {
		this.filepath = filepath
		this.client = new MongoClient(Const.MONGO_URL, { useNewUrlParser: true });

		this.rides = {}
		
		MongoClient.connect(Const.MONGO_URL, { useNewUrlParser: true }, (err, client) => {
			if (err) throw err;
			const collection = client.db("storage").collection("carona-bot");
			// this.collection.insertOne(entry, (err, result) => {
			// 	if (err) console.log(err)
			// })
			collection.find({}, { '_id': 0 }).toArray((err, result) => {
				if (err) throw err
				for (const entry of result) {
					delete entry['_id']
					this.rides[entry['chatId']] = entry
				}
			})
			client.close();
		});
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
		else if (!this.rides[chatId][direction])
			this.rides[chatId][direction] = {}
		else if (this.rides[chatId][direction].hasOwnProperty(user.id))
			isEdit = true

		this.rides[chatId][direction][user.id] = {
			'user': user,
			'time': time,
			'description': description,
			'direction': direction,
			'full': 0
		}

		this.updateMongo(chatId, user.id, direction)
		return isEdit
	}

	// Remove a ride and update the file. Returns `false` if there 
	// isn't such a ride to be removed.
	removeRide(chatId, userId, direction) {
		if (!this.rides[chatId][direction].hasOwnProperty(userId))
			return false

		delete this.rides[chatId][direction][userId]

		this.updateMongo(chatId, userId, direction)
		return true
	}

	// Set ride full (`state` = 1) or empty (`state` = 0)
	// and update the file.
	setRideFull(chatId, userId, direction, state) {
		if (!this.rides[chatId] || !this.rides[chatId][direction] ||
			!this.rides[chatId][direction].hasOwnProperty(userId))
			return false

		this.rides[chatId][direction][userId].full = state

		this.updateMongo(chatId, userId, direction)

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
		let removedRides = {}
		for (const direction of Object.keys(this.rides[chatId]))
			for (const [userId, ride] of Object.entries(this.rides[chatId][direction]))
				if (new Date(ride.time) < now) {
					removed = true
					delete this.rides[chatId][direction][userId]
					removedRides[direction + '.' + userId] = ""
				}
		if (removed == true) {
			this.updateMongoWithQuery(chatId, {
				$unset: removedRides
			})
		}
	}

	// Function to update the MongoDB using a query
	updateMongoWithQuery(chatId, query) {
		MongoClient.connect(Const.MONGO_URL, { useNewUrlParser: true }, (err, client) => {
			if (err) throw err;
			const collection = client.db("storage").collection("carona-bot");

			collection.updateOne({ 'chatId': chatId }, query,
				{ 'upsert': true }, (error, res) => {
					if (error) throw error;
					console.log(res.modifiedCount + " element(s) modified.");
				})

			client.close();
		});
	}

	// Function to update a ride of a specific user
	updateMongo(chatId, userId, direction) {
		MongoClient.connect(Const.MONGO_URL, { useNewUrlParser: true }, (err, client) => {
			if (err) throw err;
			const collection = client.db("storage").collection("carona-bot");

			let updateQuery
			let key = direction + '.' + userId
			if (this.rides[chatId][direction][userId])
				updateQuery = {
					$set: {
						[key]: this.rides[chatId][direction][userId],
					}
				}
			else
				updateQuery = {
					$unset: {
						[key]: "",
					}
				}

			collection.updateOne({ 'chatId': chatId }, updateQuery,
				{ 'upsert': true }, (error, res) => {
					if (error) throw error;
					console.log(res.modifiedCount + " element(s) modified.");
				})

			client.close();
		});
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
			let dayMonthA = Utils.addZeroPadding(dateA.getDate())
				+ "/" + Utils.addZeroPadding(dateA.getMonth())
			let dayMonthB = Utils.addZeroPadding(dateB.getDate())
				+ "/" + Utils.addZeroPadding(dateB.getMonth())

			return dayMonthA.localeCompare(dayMonthB) ||
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
			if (!previousDate || previousDate !== date.toDateString()) {
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
			if (!previousDirection || previousDirection !== ride.direction) {
				message += '\n'
				message += (ride.direction === "going") ? "*IDA*\n" : "*VOLTA*\n"
			}

			// Ride info (time and description)
			rideInfo = " - " + (hours < 10 ? "0" + hours : hours) + ":"
				+ (minutes !== 0 ? minutes : '00') + " - "
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