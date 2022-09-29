import { Group, Ride } from '../typings/ride'
import Bot from 'node-telegram-bot-api'
import * as db from './database.js'
import { weekdays, emojis } from '../utils/const.js'
import * as format from '../utils/format.js'
import { getUserLink } from '../utils/bot.js'

export default class RideManager {
  constructor() {
    db.connectToDatabase()
  }

  public async addRide(
    chatId: number,
    rideInfo: { user: Bot.User; time: Date; description: String; direction: string }
  ): Promise<boolean> {
    const ride = {
      full: 0,
      ...rideInfo
    }

    return await db.updateGroup(
      chatId,
      {
        $set: {
          [rideInfo.direction + '.' + rideInfo.user.id]: ride
        }
      },
      { upsert: true }
    )
  }

  public async removeRide(
    chatId: number,
    rideInfo: { userId: number; direction: string }
  ): Promise<boolean> {
    return await db.updateGroup(
      chatId,
      {
        $unset: {
          [rideInfo.direction + '.' + rideInfo.userId]: ''
        }
      },
      { upsert: false }
    )
  }

  public async setRideFull(
    chatId: number,
    rideInfo: { userId: number; direction: string; state: number }
  ): Promise<boolean> {
    return await db.updateGroup(
      chatId,
      {
        $set: {
          [rideInfo.direction + '.' + rideInfo.userId + '.full']: rideInfo.state
        }
      },
      { upsert: false }
    )
  }

  public async cleanRides(chatId: number, now: Date) {
    const docs = (await db.scrapeGroupRides(chatId)) as Group
    const rides = { ...docs['going'], ...docs['coming'] }

    const ridesToRemove = Object.values(rides)
      .filter((ride: Ride) => {
        ride.time < now
      })
      .forEach((ride: Ride) => ride.direction + '.' + ride.user.id)

    db.updateGroup(
      chatId,
      {
        $unset: ridesToRemove
      },
      { upsert: false }
    )
  }

  public async listRidesAsString(chatId: number): Promise<string> {
    let result = (await db.scrapeGroupRides(chatId)) as Group[]

    // No rides
    if (result.length == 0) return ''

    let group = result[0] as Group
    const comingRides = group.coming !== undefined ? Object.values(group.coming) : []
    const goingRides = group.going !== undefined ? Object.values(group.going) : []
    let totalRides = comingRides.concat(goingRides)

    //Sorting by day/month - direction - time
    totalRides.sort((a, b) => {
      let dateA = new Date(a.time)
      let dateB = new Date(b.time)
      let timeA =
        format.addZeroPadding(dateA.getHours()) + ':' + format.addZeroPadding(dateA.getMinutes())
      let timeB =
        format.addZeroPadding(dateB.getHours()) + ':' + format.addZeroPadding(dateB.getMinutes())
      let dayMonthA =
        format.addZeroPadding(dateA.getDate()) + '/' + format.addZeroPadding(dateA.getMonth())
      let dayMonthB =
        format.addZeroPadding(dateB.getDate()) + '/' + format.addZeroPadding(dateB.getMonth())

      return (
        dayMonthA.localeCompare(dayMonthB) ||
        b.direction.localeCompare(a.direction) ||
        timeA.localeCompare(timeB)
      )
    })

    // Auxiliary variables
    let message = ''
    let date, hours, minutes, day, month, weekday
    let previousDirection: string, previousDate: string
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
      weekday = weekdays.pt_br[date.getDay()]

      // Check if day/month changed to print a new line
      if (!previousDate || previousDate !== date.toDateString()) {
        changedDate = true
        if (previousDate) message += '\n'
        message +=
          format.getSpecialDayEmoji(day, month) +
          '<b>' +
          format.addZeroPadding(day) +
          '/' +
          format.addZeroPadding(month) +
          ' - ' +
          weekday +
          '</b> ' +
          emojis[date.getDay()] +
          '\n'
      }

      // Check if direction changed to print a new line and the new direction
      if (!previousDirection || changedDate || previousDirection !== ride.direction) {
        message += '\n'
        message += ride.direction === 'going' ? '<b>IDA</b>\n' : '<b>VOLTA</b>\n'
      }

      // Ride info (time and description)
      rideInfo =
        ' - ' +
        format.addZeroPadding(hours) +
        ':' +
        format.addZeroPadding(minutes) +
        ' - ' +
        ride.description

      // If it is full, generate strikethrough text.
      if (ride.full === 1) {
        rideInfo = ride.user.first_name + ' ' + (ride.user.last_name || '') + rideInfo
        message += format.strikeThrough(rideInfo) + '\n'
      }
      // If it is not, create a link for the user.
      else {
        rideInfo =
          format.getUserEmoji(ride.user) +
          ' ' +
          getUserLink(ride.user.id, ride.user.first_name, ride.user.last_name) +
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
