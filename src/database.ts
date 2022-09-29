import * as mongoDB from 'mongodb'
import { MONGO_URL, MONGO_COLLECTION_NAME } from '../utils/const.js'
import { Group } from '../typings/ride.js'

export const collections: { rides?: mongoDB.Collection } = {}
const client: mongoDB.MongoClient = new mongoDB.MongoClient(MONGO_URL)

export async function connectToDatabase() {
  await client.connect((err: any, _: any) => {
    if (err) throw err
    console.log('Connected to the MongoDB')
  })

  const db: mongoDB.Db = client.db(process.env.DB_NAME)

  const ridesCollection: mongoDB.Collection = db.collection(MONGO_COLLECTION_NAME)

  collections.rides = ridesCollection

  console.log(
    `Successfully connected to database: ${db.databaseName} and collection: ${ridesCollection.collectionName}`
  )
}

export async function closeConnection() {
  await client.close((err: any, _: any) => {
    if (err) throw err
    console.log('Closed the MongoDB connection')
  })
}

export async function scrapeGroupRides(chatId: number): Promise<unknown> {
  return await collections.rides?.find({ chatId: chatId }).toArray()
}

export async function getRide(filter: mongoDB.Filter<mongoDB.Document>): Promise<unknown> {
  const document = await collections.rides?.find(filter).toArray()

  if (!document) {
    throw Error('not found')
  }

  return document
}

export async function createGroup(
  newGroup: Group
): Promise<mongoDB.InsertOneResult<mongoDB.Document> | undefined> {
  const result = await collections.rides?.insertOne(newGroup)

  if (!result) {
    throw Error('not found')
  }

  return result
}

export async function updateGroup(
  chatId: number,
  mutation: Partial<mongoDB.Document>,
  options: {
    upsert: boolean
  }
): Promise<boolean> {
  let wasMofidied = false
  let result = await collections.rides?.updateOne({ chatId: chatId }, mutation, options)
  wasMofidied = (result?.modifiedCount as number) > 0
  console.log(result?.modifiedCount + ' element(s) modified.')
  return wasMofidied
}

export async function cleanRides(
  params: {
    chatId: number
    direction: string
    now: Date
  },
  mutation: Partial<mongoDB.Document>
) {
  let result = await collections.rides?.updateOne({ chatId: params.chatId }, mutation)
  console.log(result?.modifiedCount + ' element(s) modified.')
}
