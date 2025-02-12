'use strict'

import { BasePromptComponent } from '../BasePromptComponent.js'
import logger from '../../../logger.js'

interface FearGreedComponentConfig {
  description: string // prompt description
  date: Date
}

const defaultConfig: FearGreedComponentConfig = {
  description:
    "The following JSON document contains comprehensive market sentiment information based on the Fear and Greed index and several related indicators. It includes an overall Fear and Greed metric with its current score, rating, timestamp, and historical comparison values (from the previous close, week, month, and year). In addition, it provides detailed sentiment data for various market aspects such as market momentum for major indices (S&P 500 and S&P 125), stock price strength and breadth, put-call options ratios, and market volatility as measured by the VIX and its 50-day variant. Other metrics include indicators for junk bond demand and safe haven demand. Each of these indicators is presented with a timestamp, numerical score, qualitative rating (for example, “fear” or “extreme greed”), and, where applicable, an array of time-stamped data points that offer additional insights into the metric's evolution.",
  date: new Date(),
}

export class FearGreedComponent extends BasePromptComponent<FearGreedComponentConfig> {
  private readonly dateFormated: string

  constructor(config: Partial<FearGreedComponentConfig> = {}) {
    const mergedConfig = { ...defaultConfig, ...config }
    super(mergedConfig.description, mergedConfig)
    const year = this.config.date.getFullYear()
    const month = (this.config.date.getMonth() + 1).toString().padStart(2, '0')
    const day = this.config.date.getDate().toString().padStart(2, '0')
    this.dateFormated = `${year}-${month}-${day}`
  }

  async getContent(): Promise<string> {
    const url = `https://production.dataviz.cnn.io/index/fearandgreed/graphdata/${this.dateFormated}`
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/90.0.4430.93 Safari/537.36',
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP-Error! Status: ${response.status}`)
      }
      const jsonData = await response.json()
      return JSON.stringify(jsonData)
    } catch (error) {
      logger.error('Error fetching fear and greed index:', error)
      return `{"error": "Error fetching fear and greed index"}`
    }
  }
}
