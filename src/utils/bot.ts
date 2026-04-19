import { Group, GroupRides, Ride } from '../../typings/ride.js'
import { addCalendarDays, brasiliaLocalToUtc, getZonedParts } from './date.js'

export const parseFieldsFromMessage = (message: string) => {
  const [command, ...params] = message.split(' ')
  return { command: getPureCommand(command), params }
}

export const ridesToArray = (group: Group) => {
  const ridesByDirection = { going: group['going'], coming: group['coming'] }

  return Object.keys(ridesByDirection).reduce(function (res: Ride[], v: string) {
    const ridesInADirection = ridesByDirection[v as keyof GroupRides]
    return ridesInADirection ? res.concat(Object.values(ridesInADirection)) : res
  }, [])
}

export const unsetRides = (rides: Ride[]) => {
  let ridesObj: { [x: string]: string } = {}
  for (const ride of rides) {
    const key: string = `${ride.direction}.${ride.user.id}`
    ridesObj[key] = ''
  }
  return ridesObj
}

export const setRideDateAndTime = (now: Date, rideTime: string[], isToday: boolean) => {
  const { year, month, day } = getZonedParts(now)
  const hour = parseInt(rideTime[1], 10)
  const minute = rideTime[2] ? parseInt(rideTime[2], 10) : 0

  let y = year
  let mo = month
  let d = day

  if (!isToday && brasiliaLocalToUtc(y, mo, d, hour, minute).getTime() < now.getTime()) {
    ;[y, mo, d] = addCalendarDays(y, mo, d, 1)
  }

  return brasiliaLocalToUtc(y, mo, d, hour, minute)
}

export const getRideInfo = (params: string[]) => {
  let isToday = false
  let time
  let description

  if (params[0].trim() === 'hoje') {
    isToday = true
    time = params[1]
    description = params.slice(2, params.length).join(' ')
  } else {
    time = params[0]
    description = params.slice(1, params.length).join(' ')
  }

  return [isToday, time, description] as const
}

const getPureCommand = (command: string) => {
  if (command.indexOf('@carona_v2_bot') > -1) {
    return command.split('@')[0].toLowerCase()
  }
  return command.toLowerCase()
}
