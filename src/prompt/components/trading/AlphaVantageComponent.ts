import axios from 'axios'
import { BasePromptComponent } from '../BasePromptComponent.js'
import logger from '../../../logger.js'

interface AlphaVantageComponentConfig {
  description: string
  params: Record<string, any>
}

const defaultConfig: AlphaVantageComponentConfig = {
  description: '',
  params: {},
}

export class AlphaVantageComponent extends BasePromptComponent<AlphaVantageComponentConfig> {
  constructor(config: Partial<AlphaVantageComponentConfig> = {}) {
    const mergedConfig = { ...defaultConfig, ...config }
    super(mergedConfig.description, mergedConfig)
  }

  async getContent(): Promise<string> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY
    if (!apiKey) {
      throw new Error('Alpha Vantage API key not set in environment')
    }
    const baseUrl = 'https://www.alphavantage.co/query'
    const params = {
      ...this.config.params,
      apikey: apiKey,
    }
    try {
      const response = await axios.get(baseUrl, { params })
      return JSON.stringify(response.data)
    } catch (error) {
      logger.error('Error fetching data from Alpha Vantage:', error)
      return `{"error": "Error fetching data from Alpha Vantage"}`
    }
  }
}
