export interface Ride {
  user: User
  time: Date
  description: String
  direction: string
  full: number
}

export interface User {
  first_name: string
  last_name: string
  id: number
  is_bot: boolean
}

export interface GroupRides {
  going?: {
    [key: string]: Ride
  }
  coming?: {
    [key: string]: Ride
  }
}

export type Group = GroupRides & {
  chatId: number
}
