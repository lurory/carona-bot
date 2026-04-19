import { Collection, Db, Document, Filter, InsertOneResult, MongoClient } from 'mongodb'
import { Group } from '../typings/ride.js'
import { MONGO_COLLECTION_NAME, MONGO_URL } from './utils/const.js'

export class Database {
  _client: MongoClient
  _collection: Collection | undefined

  constructor() {
    this._client = new MongoClient(MONGO_URL)
  }

  connect = () => {
    this._client.connect().finally(() => console.log('Connected to the MongoDB'))
    const db: Db = this._client.db(process.env.DB_NAME)

    const ridesCollection: Collection = db.collection(MONGO_COLLECTION_NAME)

    this._collection = ridesCollection

    console.log(
      `Successfully connected to database: ${db.databaseName} and collection: ${ridesCollection.collectionName}`
    )
  }

  disconnect = () =>
    this._client.close().then(
      () => console.log('Closed connection with MongoDB'),
      (reason: unknown) => console.log(`Close connection was unsuccessful. Reason: ${reason}`)
    )

  scrapeGroupRides = (chatId: number): Promise<Group[]> =>
    this._collection?.find({ chatId: chatId }).toArray() as Promise<unknown> as Promise<Group[]>

  listAllGroupChatIds = async (): Promise<number[]> => {
    if (!this._collection) return []
    const ids = await this._collection.distinct('chatId', {})
    return ids.filter((id): id is number => typeof id === 'number')
  }

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
    let wasModified = false
    let result = await this._collection?.updateOne({ chatId: chatId }, mutation, options)
    wasModified = (result?.modifiedCount as number) > 0
    console.log(result?.modifiedCount + ' element(s) modified.')

    return wasModified
  }
}
