import { Collection, Db, type Document, MongoClient } from 'mongodb'
import { BasePromptComponent } from '../BasePromptComponent.js'
import logger from '../../../logger.js'

interface MongoComponentConfig {
  description: string
  uri: string
  dbName?: string
  collectionName?: string
  query?: Document
  projection?: Document
}

const defaultConfig: MongoComponentConfig = {
  description: '',
  uri: '',
}

export class MongoComponent extends BasePromptComponent<MongoComponentConfig> {
  constructor(config: Partial<MongoComponentConfig> = {}) {
    const mergedConfig = { ...defaultConfig, ...config }
    super(mergedConfig.description, mergedConfig)
  }

  async getContent(): Promise<string> {
    const client = new MongoClient(this.config.uri)
    try {
      await client.connect()
      const dbName = this.config.dbName || 'defaultDb'
      const collectionName = this.config.collectionName || 'defaultCollection'
      const db: Db = client.db(dbName)
      const collection: Collection<Document> = db.collection(collectionName)
      const cursor = collection.find(this.config.query || {}, {
        projection: this.config.projection,
      })
      const results = await cursor.toArray()
      return JSON.stringify(results)
    } catch (error) {
      logger.error(
        `Error querying data from mongo db: query=${this.config.query}, ${error}`,
      )
      return `{"error": "Error querying data from mongo db"}`
    } finally {
      await client.close()
    }
  }
}
