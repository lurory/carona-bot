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

export interface RidesPerDirection {
  [key: string]: {
    [key: string]: Ride
  }
}

export type Entry = RidesPerDirection & {
  chatId: number
}
