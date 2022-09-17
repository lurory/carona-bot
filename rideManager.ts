import { User, Ride, Entry } from './typings/ride'
import * as db from './src/database'
const Const = require('./const.js')
const Utils = require('./utils.js')

// type RidesObject = { [key: string]: Entry }

export default class RideManager {
  // private rides: RidesObject
  constructor() {
    // this.rides = {}
    db.connectToDatabase()
  }

  public addRide(
    chatId: number,
    user: User,
    time: Date,
    description: String,
    direction: string
  ): boolean {
    let isEdit = false
    if (!this.rides[chatId]) {
      this.rides[chatId] = {
        chatId: chatId
      }
      this.rides[chatId]['going'] = {}
      this.rides[chatId]['coming'] = {}
    } else if (!this.rides[chatId][direction])
      this.rides[chatId][direction] = {}
    else if (this.rides[chatId][direction][user.id]) isEdit = true

    this.rides[chatId][direction][user.id] = {
      user: user,
      time: time,
      description: description,
      direction: direction,
      full: 0
    }

    this.updateMongo(chatId, user.id, direction)
    return isEdit
  }

  public removeRide(
    chatId: number,
    userId: number,
    direction: string
  ): boolean {
    if (!this.rides[chatId][direction][userId]) return false

    delete this.rides[chatId][direction][userId]
    this.updateMongo(chatId, userId, direction)

    return true
  }

  public setRideFull(
    chatId: number,
    userId: number,
    direction: string,
    state: number
  ): boolean {
    if (
      !this.rides[chatId] ||
      !this.rides[chatId][direction] ||
      !this.rides[chatId][direction].hasOwnProperty(userId)
    )
      return false

    this.rides[chatId][direction][userId].full = state
    this.updateMongo(chatId, userId, direction)

    return true
  }

  public clean(chatId: number, now: Date) {
    if (!this.rides[chatId]) {
      this.rides[chatId] = {
        chatId: chatId,
        'going': {},
        'coming': {}
      }
      return
    }

    // let now = new Date().toLocaleString("pt-BR", { "timeZone": "America/Sao_Paulo" })
    // now = new Date(now)
    let removed = false
    let removedRides: { [key: string]: string } = {}

    for (const direction of Object.keys(this.rides[chatId])) {
      
      let entries = Object.entries(this.rides[chatId][direction])
      for (const [userId, ride] of entries) {
        if (new Date(ride.time) < now) {
          removed = true
          delete this.rides[chatId][direction][userId]
          removedRides[direction + '.' + userId] = ''
        }
      }
    }

    if (removed == true) {
      this.updateMongoWithQuery(chatId, {
        $unset: removedRides
      })
    }
  }

  // Function to update the MongoDB using a query
  updateMongoWithQuery(chatId: number, query: any) {
    db.collection('carona-bot').updateOne(
      { chatId: chatId },
      query,
      { upsert: true },
      (error: Error, res: any) => {
        if (error) throw error
        console.log(res.modifiedCount + ' element(s) modified.')
      }
    )
  }

  // Function to update a ride of a specific user
  updateMongo(chatId: number, userId: number, direction: string) {
    let updateQuery: any
    let key = direction + '.' + userId
    if (this.rides[chatId][direction][userId])
      updateQuery = {
        $set: {
          [key]: this.rides[chatId][direction][userId]
        }
      }
    else
      updateQuery = {
        $unset: {
          [key]: ''
        }
      }

    db.collection('carona-bot').updateOne(
      { chatId: chatId },
      updateQuery,
      { upsert: true },
      (error, res) => {
        if (error) throw error
        console.log(res.modifiedCount + ' element(s) modified.')
      }
    )
  }

  public listRidesAsString(chatId: number): string {
    let totalRides: Ride[] = []
    let message: string

    // No rides
    if (!this.rides[chatId]) return ''

    // Concatenate rides arrays to a single array
    totalRides = this.rides[chatId]['going'] + this.rides[chatId]['coming']
    // Object.entries(this.rides[chatId]).forEach(direction => {
    // 	const rides: Ride[] = Object.values(direction[1])
    // 	totalRides = totalRides.concat(rides)
    // })

    //Sorting by day/month - direction - time
    totalRides.sort((a, b) => {
      let dateA = new Date(a.time)
      let dateB = new Date(b.time)
      let timeA =
        Utils.addZeroPadding(dateA.getHours()) +
        ':' +
        Utils.addZeroPadding(dateA.getMinutes())
      let timeB =
        Utils.addZeroPadding(dateB.getHours()) +
        ':' +
        Utils.addZeroPadding(dateB.getMinutes())
      let dayMonthA =
        Utils.addZeroPadding(dateA.getDate()) +
        '/' +
        Utils.addZeroPadding(dateA.getMonth())
      let dayMonthB =
        Utils.addZeroPadding(dateB.getDate()) +
        '/' +
        Utils.addZeroPadding(dateB.getMonth())

      return (
        dayMonthA.localeCompare(dayMonthB) ||
        b.direction.localeCompare(a.direction) ||
        timeA.localeCompare(timeB)
      )
    })

    // Auxiliary variables
    message = ''
    let date, hours, minutes, day, month, weekday
    let previousDirection, previousDate
    let rideInfo
    let changedDate = false

    // Assemble the message while iterating over the
    // rides array
    totalRides.forEach((ride) => {
      date = new Date(ride.time)
      hours = date.getHours()
      minutes = date.getMinutes()
      day = date.getDate()
      month = date.getMonth() + 1
      weekday = Const.weekdays.pt_br[date.getDay()]

      // Check if day/month changed to print a new line
      if (!previousDate || previousDate !== date.toDateString()) {
        changedDate = true
        if (previousDate) message += '\n'
        message +=
          Utils.getSpecialDayEmoji(day, month) +
          '<b>' +
          Utils.addZeroPadding(day) +
          '/' +
          Utils.addZeroPadding(month) +
          ' - ' +
          weekday +
          '</b> ' +
          Const.emojis[date.getDay()] +
          '\n'
      }

      // Check if direction changed to print a new line and the new direction
      if (
        !previousDirection ||
        changedDate ||
        previousDirection !== ride.direction
      ) {
        message += '\n'
        message +=
          ride.direction === 'going' ? '<b>IDA</b>\n' : '<b>VOLTA</b>\n'
      }

      // Ride info (time and description)
      rideInfo =
        ' - ' +
        Utils.addZeroPadding(hours) +
        ':' +
        Utils.addZeroPadding(minutes) +
        ' - ' +
        ride.description

      // If it is full, generate strikethrough text.
      if (ride.full === 1) {
        rideInfo =
          ride.user.first_name + ' ' + (ride.user.last_name || '') + rideInfo
        message += Utils.strikeThrough(rideInfo) + '\n'
      }
      // If it is not, create a link for the user.
      else {
        rideInfo =
          Utils.getUserEmoji(ride.user) +
          ' ' +
          Utils.getUserLink(
            ride.user.id,
            ride.user.first_name,
            ride.user.last_name
          ) +
          rideInfo
        message += rideInfo + '\n'
      }

      previousDirection = ride.direction
      previousDate = date.toDateString()
      changedDate = false
    })

    return message
  }
}
