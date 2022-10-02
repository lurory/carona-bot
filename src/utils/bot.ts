import { Group, GroupRides, Ride } from '../../typings/ride.js'
import { getCurrentTime } from './date.js'

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

const getPureCommand = (command: string) => {
  if (command.indexOf('@carona_v2_bot') > -1) {
    return command.split('@')[0].toLowerCase()
  }
  return command.toLowerCase()
}

export const setRideDate = (hours: number, minutes: number = 0, isToday: boolean = false) => {
  let rideDate = getCurrentTime()
  rideDate.setSeconds(0)
  rideDate.setHours(hours)
  rideDate.setMinutes(minutes)

  // If the "today" flag is not present and the ride hour/minute is before
  // the current time.
  if (!isToday && rideDate < getCurrentTime()) rideDate.setDate(rideDate.getDate() + 1)

  return rideDate
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
