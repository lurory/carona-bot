import * as mongoDB from 'mongodb'
import * as dotenv from 'dotenv'
import { MONGO_URL, MONGO_COLLECTION_NAME } from '../utils/const'
import { Entry } from '../typings/ride'

export const collections: { rides?: mongoDB.Collection } = {}

export async function connectToDatabase() {
  dotenv.config()

  const client: mongoDB.MongoClient = new mongoDB.MongoClient(MONGO_URL)

  await client.connect()

  const db: mongoDB.Db = client.db(process.env.DB_NAME)

  const ridesCollection: mongoDB.Collection = db.collection(MONGO_COLLECTION_NAME)

  collections.rides = ridesCollection

  console.log(
    `Successfully connected to database: ${db.databaseName} and collection: ${ridesCollection.collectionName}`
  )
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
