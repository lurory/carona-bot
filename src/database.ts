import * as mongoDB from 'mongodb'
import * as dotenv from 'dotenv'
import { MONGO_URL, MONGO_COLLECTION_NAME } from '../utils/const'
import { Entry } from '../typings/ride'

export const collections: { rides?: mongoDB.Collection } = {}
const client: mongoDB.MongoClient = new mongoDB.MongoClient(MONGO_URL)

export function connectToDatabase() {
  dotenv.config()

  client.connect((err: any, _: any) => {
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

export function closeConnection() {
  client.close((err: any, _: any) => {
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
  newGroup: Entry
): Promise<mongoDB.InsertOneResult<mongoDB.Document> | undefined> {
  const result = await collections.rides?.insertOne(newGroup)

  if (!result) {
    throw Error('not found')
  }

  return result
}

export async function updateRide(
  chatId: number,
  mutation: Partial<mongoDB.Document>,
  shouldUpsert: boolean
) {
  collections.rides?.updateOne(
    { chatId: chatId },
    mutation,
    { upsert: shouldUpsert },
    (error, res) => {
      if (error) throw error
      console.log(res?.modifiedCount + ' element(s) modified.')
    }
  )
}