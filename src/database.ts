import { MongoClient, Collection, Db, InsertOneResult, Filter, Document } from 'mongodb'
import { MONGO_URL, MONGO_COLLECTION_NAME } from './utils/const.js'
import { Group } from '../typings/ride.js'

export class Database {
  _client: MongoClient
  _collection: Collection | undefined

  constructor() {
    this._client = new MongoClient(MONGO_URL)
  }

  connect = () => {
    this._client.connect((err: any, _: any) => {
      if (err) throw err
      console.log('Connected to the MongoDB')
    })

    const db: Db = this._client.db(process.env.DB_NAME)

    const ridesCollection: Collection = db.collection(MONGO_COLLECTION_NAME)

    this._collection = ridesCollection

    console.log(
      `Successfully connected to database: ${db.databaseName} and collection: ${ridesCollection.collectionName}`
    )
  }

  disconnect = () =>
    this._client.close((err: any, _: any) => {
      if (err) throw err
      console.log('Closed the MongoDB connection')
    })

  scrapeGroupRides = (chatId: number): Promise<Group[]> =>
    this._collection?.find({ chatId: chatId }).toArray() as Promise<unknown> as Promise<Group[]>

  getRide = async (filter: Filter<Document>): Promise<unknown[]> => {
    const document = await this._collection?.find(filter).toArray()

    if (!document) {
      throw Error('not found')
    }

    return document
  }

  createGroup = (newGroup: Group): Promise<InsertOneResult<Document>> | undefined =>
    this._collection?.insertOne(newGroup)

  updateGroup = async (
    chatId: number,
    mutation: Partial<Document>,
    options: {
      upsert: boolean
    }
  ): Promise<boolean> => {
    let wasMofidied = false
    let result = await this._collection?.updateOne({ chatId: chatId }, mutation, options)
    wasMofidied = (result?.modifiedCount as number) > 0
    console.log(result?.modifiedCount + ' element(s) modified.')

    return wasMofidied
  }
}
