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
  runmode: string
  timeframe: string
  pair: string
  candles: Candle[]
}

export class FreqtradeComponent implements PromptComponent {
  private readonly pair: string
  private readonly timeframe: string
  private readonly candles: Candle[]

  constructor(body: any) {
    const transformedBody = this.transformBody(body)
    this.pair = transformedBody.pair
    this.timeframe = transformedBody.timeframe
    this.candles = transformedBody.candles
  }

  getDescription(): string {
    return `Historical market data for trading pair ${this.pair} and timeframe ${this.timeframe}:`
  }

  async getContent(): Promise<string> {
    return JSON.stringify(this.candles)
  }

  transformBody(body: any): TransformedBody {
    const { runmode, timeframe, metadata, candles } = body
    return {
      runmode,
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
