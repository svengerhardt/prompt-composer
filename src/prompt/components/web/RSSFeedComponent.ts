import Parser from 'rss-parser'
import striptags from 'striptags'
import { BasePromptComponent } from '../BasePromptComponent.js'
import logger from '../../../logger.js'

interface RssFeedComponentConfig {
  description: string // prompt description
  feedUrl: string
  limit?: number
}

const defaultConfig: RssFeedComponentConfig = {
  description:
    'The following JSON document from {{feedUrl}} is an array of objects, each representing an RSS feed item.',
  feedUrl: 'https://news.bitcoin.com/feed/',
  limit: undefined,
}

interface Article {
  pubDate: string
  title: string
  content: string
}

export class RSSFeedComponent extends BasePromptComponent<RssFeedComponentConfig> {
  private parser: Parser

  constructor(config: Partial<RssFeedComponentConfig> = {}) {
    const mergedConfig = { ...defaultConfig, ...config }
    super(mergedConfig.description, mergedConfig)
    this.parser = new Parser()
  }

  async getContent(): Promise<string> {
    try {
      const feed = await this.parser.parseURL(this.config.feedUrl)
      let articles: Article[] = feed.items.map((item) => ({
        pubDate: item.pubDate || '',
        title: item.title || '',
        content: striptags(item.content || item.description || ''),
      }))

      if (this.config.limit && articles.length > this.config.limit) {
        articles = articles.slice(0, this.config.limit)
      }

      return JSON.stringify(articles)
    } catch (error) {
      logger.error('Error parsing rss feed:', error)
      return `{"error": "Error parsing rss feed"}`
    }
  }
}
