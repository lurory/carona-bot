import { Group, GroupRides, Ride } from '../../typings/ride.js'

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
  let rideDateAndTime = new Date()
  rideDateAndTime.setSeconds(0)
  rideDateAndTime.setHours(parseInt(rideTime[1]))

  rideTime[2] ? rideDateAndTime.setMinutes(parseInt(rideTime[2])) : rideDateAndTime.setMinutes(0)

  // If the "today" flag is not present and the ride hour/minute is before
  // the current time.
  if (!isToday && rideDateAndTime < now) rideDateAndTime.setDate(rideDateAndTime.getDate() + 1)

  return rideDateAndTime
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
