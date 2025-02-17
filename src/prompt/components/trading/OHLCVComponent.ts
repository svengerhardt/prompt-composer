import ccxt, { type int } from 'ccxt'
import { BasePromptComponent } from '../BasePromptComponent.js'
import logger from '../../../logger.js'

/*interface OHLCVData {
    date: string; // ISO string of the date
    open: number; // Open price
    high: number; // High price
    low: number;  // Low price
    close: number; // Close price
    volume: number; // Volume traded
}*/

interface OHLCVComponentConfig {
  description: string // prompt description
  exchange: string // name of the exchange
  symbol: string // symbol of the market to fetch OHLCV data for
  timeframe: string // the length of time each candle represents
  since: int | undefined // timestamp in ms of the earliest candle to fetch
  limit: int // the maximum amount of candles to fetch
}

const defaultConfig: OHLCVComponentConfig = {
  description:
    'The following JSON array contains historical market data for the trading pair {{symbol}} over a {{timeframe}} timeframe. Each object in the array represents a interval and includes a timestamp in the "date" field, as well as the "open", "high", "low", and "close" prices for that period, along with the "volume" traded during that interval.',
  exchange: 'binance',
  symbol: 'BTC/USDC',
  timeframe: '1d',
  since: undefined,
  limit: 30,
}

export class OHLCVComponent extends BasePromptComponent<OHLCVComponentConfig> {
  constructor(config: Partial<OHLCVComponentConfig> = {}) {
    const mergedConfig = { ...defaultConfig, ...config }
    super(mergedConfig.description, mergedConfig)
  }

  async getContent(): Promise<string> {
    try {
      const CCXT = ccxt as any // hack
      let exchange = new CCXT[this.config.exchange]()
      await exchange.fetchMarkets()
      const ohlcv = await exchange.fetchOHLCV(
        this.config.symbol,
        this.config.timeframe,
        this.config.since,
        this.config.limit,
      )

      let data = ohlcv.map((item: any[]) => ({
        date: new Date(Number(item[0])).toISOString(),
        open: Number(item[1]),
        high: Number(item[2]),
        low: Number(item[3]),
        close: Number(item[4]),
        volume: Number(item[5]),
      }))

      return JSON.stringify(data)
    } catch (error) {
      logger.error(
        `Error fetching OHLCV: exchange=${this.config.exchange}, symbol=${this.config.symbol}, timeframe=${this.config.timeframe}, ${error}`,
      )
      return `{"error": "Error fetching OHLCV data"}`
    }
  }
}
