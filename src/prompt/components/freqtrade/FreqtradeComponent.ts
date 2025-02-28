import type { PromptComponent } from '../PromptComponent.js'

interface Candle {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  [key: string]: any
}

interface TransformedBody {
  exchange: string
  timeframe: string
  pair: string
  candles: Candle[]
}

export class FreqtradeComponent implements PromptComponent {
  private readonly exchange: string
  private readonly pair: string
  private readonly timeframe: string
  private readonly candles: Candle[]

  constructor(body: any) {
    const transformedBody = this.transformBody(body)
    this.exchange = transformedBody.exchange
    this.pair = transformedBody.pair
    this.timeframe = transformedBody.timeframe
    this.candles = transformedBody.candles
  }

  getDescription(): string {
    return `Historical market data from ${this.exchange} for trading pair ${this.pair} and timeframe ${this.timeframe}`
  }

  async getContent(): Promise<string> {
    return JSON.stringify(this.candles)
  }

  transformBody(body: any): TransformedBody {
    const { exchange, timeframe, metadata, candles } = body
    return {
      exchange,
      timeframe,
      pair: metadata.pair,
      candles: candles.map((candle: any): Candle => {
        const { date, open, high, low, close, volume, ...rest } = candle
        const { enter_tag, enter_long, enter_short, ...optionalFields } = rest
        return {
          date,
          open,
          high,
          low,
          close,
          volume,
          ...optionalFields,
        }
      }),
    }
  }
}
