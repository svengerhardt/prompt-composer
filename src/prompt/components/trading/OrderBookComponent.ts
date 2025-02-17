import ccxt, { type int } from 'ccxt'
import { BasePromptComponent } from '../BasePromptComponent.js'
import logger from '../../../logger.js'

interface OrderBookComponentConfig {
  description: string // prompt description
  exchange: string // name of the exchange
  symbol: string // symbol of the market to fetch the order book for
  limit: int | undefined // the maximum amount of order book entries to return
}

const defaultConfig: OrderBookComponentConfig = {
  description:
    'The following JSON document represents an order book for a trading pair. It includes a "symbol" field that specifies the trading pair, two arrays called "bids" and "asks" where each entry is a two-element array containing the price and amount respectively, and a "nonce" field that serves as a sequential identifier for the order book snapshot.',
  exchange: 'binance',
  symbol: 'BTC/USDC',
  limit: undefined,
}

export class OrderBookComponent extends BasePromptComponent<OrderBookComponentConfig> {
  constructor(config: Partial<OrderBookComponentConfig> = {}) {
    const mergedConfig = { ...defaultConfig, ...config }
    super(mergedConfig.description, mergedConfig)
  }

  async getContent(): Promise<string> {
    try {
      const CCXT = ccxt as any // hack
      let exchange = new CCXT[this.config.exchange]()
      await exchange.fetchMarkets()
      let orderbook = await exchange.fetchOrderBook(
        this.config.symbol,
        this.config.limit,
      )
      return JSON.stringify(orderbook)
    } catch (error) {
      logger.error(
        `Error fetching order book: exchange=${this.config.exchange}, symbol=${this.config.symbol}, ${error}`,
      )
      return `{"error": "Error fetching order book"}`
    }
  }
}
