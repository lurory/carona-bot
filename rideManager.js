const Const = require('./const.js')
const Utils = require("./utils.js")

const MongoClient = require('mongodb').MongoClient

var client
var db

class RideManager {
	constructor() {
		this.rides = {}

		MongoClient.connect(Const.MONGO_URL, { useNewUrlParser: true }, (err, client_conn) => {
			if (err) throw err

			client = client_conn
			db = client.db("storage")

			console.log("Connected to the MongoDB")

			// this.collection.insertOne(entry, (err, result) => {
			// 	if (err) console.log(err)
			// })
			db.collection("carona-bot").find({}, { projection: {_id: 0 }}).toArray((err, result) => {
				if (err) throw err
				for (const entry of result) {
					this.rides[entry['chatId']] = entry
				}
			})
		})
	}

	closeConnection() {
		client.close()
		console.log("Closed the MongoDB connection")
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
	clean(chatId, now) {
		if (!this.rides.hasOwnProperty(chatId)) {
			this.rides[chatId] = {}
			this.rides[chatId]['going'] = {}
			this.rides[chatId]['coming'] = {}
			return
		}

		// let now = new Date().toLocaleString("pt-BR", { "timeZone": "America/Sao_Paulo" })
		// now = new Date(now)
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
		db.collection("carona-bot").updateOne({ 'chatId': chatId }, query,
			{ 'upsert': true }, (error, res) => {
				if (error) throw error
				console.log(res.modifiedCount + " element(s) modified.")
			})
	}

	// Function to update a ride of a specific user
	updateMongo(chatId, userId, direction) {
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

		db.collection("carona-bot").updateOne({ 'chatId': chatId }, updateQuery,
			{ 'upsert': true }, (error, res) => {
				if (error) throw error
				console.log(res.modifiedCount + " element(s) modified.")
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
				changedDate = true
				if (previousDate)
					message += "\n"
				message += Utils.getSpecialDayEmoji(day, month) + "<b>" + (Utils.addZeroPadding(day))
					+ "/"
					+ (Utils.addZeroPadding(month))
					+ " - " + weekday + "</b> " + Const.emojis[date.getDay()]
					+ "\n"
			}

			// Check if direction changed to print a new line and the new direction
			if (!previousDirection || changedDate || previousDirection !== ride.direction) {
				message += '\n'
				message += (ride.direction === "going") ? "<b>IDA</b>\n" : "<b>VOLTA</b>\n"
			}

			// Ride info (time and description)
			rideInfo = " - " + (Utils.addZeroPadding(hours)) + ":"
				+ (Utils.addZeroPadding(minutes)) + " - "
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
					+ Utils.getUserLink(ride.user.id, ride.user.first_name, ride.user.last_name)
					+ rideInfo
				message += rideInfo + "\n"
			}

			previousDirection = ride.direction
			previousDate = date.toDateString()
			changedDate = false
		})

		// Return the full message.
		return message
	}
}

module.exports = RideManager