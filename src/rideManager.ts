import Bot from 'node-telegram-bot-api'

import { Group, Ride } from '../typings/ride'

import { Database } from './database.js'
import { getDifference } from './utils/array.js'
import { ridesToArray, unsetRides } from './utils/bot.js'
import { emojis, weekdays } from './utils/const.js'
import {
  USER_TIME_ZONE,
  getWeekdayIndexInZone,
  getZonedParts,
  zonedDateSortKey
} from './utils/date.js'
import * as format from './utils/format.js'
import { compareValues } from './utils/format.js'
import { getUserLink } from './utils/messages.js'

export default class RideManager {
  db: Database

  constructor() {
    this.db = new Database()
    this.db.connect()
  }

  public async addRide(
    chatId: number,
    rideInfo: { user: Bot.User; time: Date; description: String; direction: string }
  ): Promise<boolean> {
    const ride = {
      full: 0,
      ...rideInfo
    }

    return await this.db.updateGroup(
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
    return await this.db.updateGroup(
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
    return this.db.updateGroup(
      chatId,
      {
        $set: {
          [rideInfo.direction + '.' + rideInfo.userId + '.full']: rideInfo.state
        }
      },
      { upsert: false }
    )
  }

  public async cleanRides(chatId: number, now: Date): Promise<Ride[]> {
    const docs = await this.db.scrapeGroupRides(chatId)
    if (docs.length === 0) return []

    const group = docs[0] as Group
    const rides = ridesToArray(group)

    const ridesToRemove = rides.filter((ride: Ride) => ride.time < now)

    this.db.updateGroup(
      chatId,
      {
        $unset: unsetRides(ridesToRemove)
      },
      { upsert: false }
    )

    return getDifference(rides as Ride[], ridesToRemove as Ride[])
  }

  public async getAllGroupChatIds(): Promise<number[]> {
    return this.db.listAllGroupChatIds()
  }

  public async listRidesAsString(chatId: number): Promise<string> {
    let result = await this.db.scrapeGroupRides(chatId)

    if (result.length === 0) return ''

    const group = result[0] as Group
    let rides = ridesToArray(group)

    //It sorts by day/month, then direction, then time
    const tz = USER_TIME_ZONE
    rides.sort((a, b) => {
      return (
        compareValues(
          zonedDateSortKey(new Date(a.time), tz),
          zonedDateSortKey(new Date(b.time), tz)
        ) ||
        compareValues(a.direction, b.direction) ||
        compareValues(new Date(a.time), new Date(b.time))
      )
    })

    // Auxiliary variables
    let message = ''
    let previousDirection: string, previousDate: string
    let rideInfo
    let changedDate = false

    // Assemble the message while iterating over the
    // rides array
    rides.forEach((ride) => {
      const when = new Date(ride.time)
      const z = getZonedParts(when, USER_TIME_ZONE)
      const weekdayIdx = getWeekdayIndexInZone(when, USER_TIME_ZONE)

      // Avoid problems when accessing the user
      if (!ride.user) return

      // Check if day/month changed to print a new line
      const dateLineKey = `${z.year}-${z.month}-${z.day}`
      if (!previousDate || previousDate !== dateLineKey) {
        changedDate = true
        if (previousDate) message += '\n'
        message +=
          format.getSpecialDayEmoji(z.day, z.month) +
          '<b>' +
          format.addZeroPadding(z.day) +
          '/' +
          format.addZeroPadding(z.month) +
          ' - ' +
          weekdays.pt_br[weekdayIdx] +
          '</b> ' +
          emojis[weekdayIdx] +
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
        format.addZeroPadding(z.hour) +
        ':' +
        format.addZeroPadding(z.minute) +
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
      previousDate = dateLineKey
      changedDate = false
    })

    return message
  }
}
