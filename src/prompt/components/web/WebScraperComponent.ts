import axios from 'axios'
import * as cheerio from 'cheerio'
import { BasePromptComponent } from '../BasePromptComponent.js'
import logger from '../../../logger.js'

interface WebScraperComponentConfig {
  description: string
  url: string
}

const defaultConfig: WebScraperComponentConfig = {
  description: '',
  url: '',
}

export class WebScraperComponent extends BasePromptComponent<WebScraperComponentConfig> {
  constructor(config: Partial<WebScraperComponentConfig> = {}) {
    const mergedConfig = { ...defaultConfig, ...config }
    super(mergedConfig.description, mergedConfig)
  }

  private extract(html: string): string {
    const $ = cheerio.load(html)
    $('script, style, noscript').remove()
    const bodyText = $('body').text()
    return bodyText.replace(/\s+/g, ' ').trim()
  }

  /*chunkText(text: string, maxLength: number = 1000): string[] {
    const chunks: string[] = []
    let start = 0
    while (start < text.length) {
      chunks.push(text.substring(start, start + maxLength))
      start += maxLength
    }
    return chunks
  }*/

  async getContent(): Promise<string> {
    try {
      const { data } = await axios.get(this.config.url)
      return this.extract(data)
    } catch (error) {
      logger.error(`Error fetching website: url=${this.config.url}, ${error}`)
      return `{"error": "Error fetching website"}`
    }
  }
}
