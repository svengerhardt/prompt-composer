import ccxt, { type int } from 'ccxt'
import { Indicators } from '@ixjb94/indicators'
import { BasePromptComponent } from '../BasePromptComponent.js'
import logger from '../../../logger.js'

interface IndicatorConfig {
  period: number
}

interface MACDIndicatorConfig {
  short_period: number
  long_period: number
  signal_period: number
}

interface OHLCV2ComponentConfig {
  description: string // prompt description
  exchange: string // name of the exchange
  symbol: string // symbol of the market to fetch OHLCV data for
  timeframe: string // the length of time each candle represents
  since: int | undefined // timestamp in ms of the earliest candle to fetch
  inputCandles: number // number of candles retrieved and basis for indicator calculation
  outputCandles?: number // final output: number of last candles + calculated indicators (default: inputCandles)
  indicators?: {
    // Indicator configuration
    sma?: IndicatorConfig
    ema?: IndicatorConfig
    rsi?: IndicatorConfig
    macd?: MACDIndicatorConfig
  }
}

const defaultConfig: OHLCV2ComponentConfig = {
  description:
    'The following JSON array contains historical market data for the trading pair {{symbol}} over a {{timeframe}} timeframe.',
  exchange: 'binance',
  symbol: 'BTC/USDC',
  timeframe: '1d',
  since: undefined,
  inputCandles: 30,
  outputCandles: 30,
  indicators: {},
}

export class OHLCV2Component extends BasePromptComponent<OHLCV2ComponentConfig> {
  constructor(config: Partial<OHLCV2ComponentConfig> = {}) {
    // If outputCandles is not set, inputCandles is used
    if (
      config.outputCandles === undefined &&
      config.inputCandles !== undefined
    ) {
      config.outputCandles = config.inputCandles
    }
    const mergedConfig = { ...defaultConfig, ...config }
    super(mergedConfig.description, mergedConfig)
  }

  async getContent(): Promise<string> {
    try {
      const CCXT = ccxt as any
      let exchange = new CCXT[this.config.exchange]()
      await exchange.fetchMarkets()

      // Retrieve OHLCV data
      const rawOHLCV: any[] = await exchange.fetchOHLCV(
        this.config.symbol,
        this.config.timeframe,
        this.config.since,
        this.config.inputCandles,
      )

      // Conversion of the raw data into an array of candle objects
      const candles = rawOHLCV.map((candle) => {
        const [timestamp, open, high, low, close, volume] = candle
        return {
          time: new Date(timestamp).toISOString(),
          open,
          high,
          low,
          close,
          volume,
        }
      })

      // Preparation of the indicator calculation
      let indicatorsOutput: any[] = []
      // Save the calculated indicators together with their offsets
      const computedIndicators: {
        [key: string]: { offset: number; values: number[] }
      } = {}
      let computedMACD:
        | { offset: number; macd: number[]; signal: number[]; hist: number[] }
        | undefined = undefined

      const ta = new Indicators()
      // Extract close values
      const closePrices = candles.map((candle) => candle.close)

      if (
        this.config.indicators &&
        Object.keys(this.config.indicators).length > 0
      ) {
        if (this.config.indicators.sma) {
          const smaValues = await ta.sma(
            closePrices,
            this.config.indicators.sma.period,
          )
          const offset = candles.length - smaValues.length
          computedIndicators['sma'] = { offset, values: smaValues }
        }
        if (this.config.indicators.ema) {
          const emaValues = await ta.ema(
            closePrices,
            this.config.indicators.ema.period,
          )
          const offset = candles.length - emaValues.length
          computedIndicators['ema'] = { offset, values: emaValues }
        }
        if (this.config.indicators.rsi) {
          const rsiValues = await ta.rsi(
            closePrices,
            this.config.indicators.rsi.period,
          )
          const offset = candles.length - rsiValues.length
          computedIndicators['rsi'] = { offset, values: rsiValues }
        }
        if (this.config.indicators.macd) {
          const macdConfig = this.config.indicators.macd
          const [macdValues, macdSignal, macdHist] = (await ta.macd(
            closePrices,
            macdConfig.short_period,
            macdConfig.long_period,
            macdConfig.signal_period,
            closePrices.length,
          )) as [number[], number[], number[]]
          const offset = candles.length - macdValues.length
          computedMACD = {
            offset,
            macd: macdValues,
            signal: macdSignal,
            hist: macdHist,
          }
        }
      }

      // Calculate the global offset: maximum offset of all calculated indicators
      let offsets: number[] = []
      for (const key in computedIndicators) {
        if (computedIndicators[key] !== undefined) {
          offsets.push(computedIndicators[key]!.offset)
        }
      }
      if (computedMACD) {
        offsets.push(computedMACD.offset)
      }
      const globalOffset = offsets.length > 0 ? Math.max(...offsets) : 0

      // Determine the maximum number of valid output values from the calculated indicators
      let validLength = candles.length - globalOffset
      for (const key in computedIndicators) {
        const ind = computedIndicators[key]!
        const available = ind.values.length - (globalOffset - ind.offset)
        if (available < validLength) {
          validLength = available
        }
      }
      if (computedMACD) {
        const available =
          computedMACD.macd.length - (globalOffset - computedMACD.offset)
        if (available < validLength) {
          validLength = available
        }
      }

      // Function for rounding to a maximum of 2 decimal places
      const round = (num: number): number => Number(num.toFixed(2))

      // Structure of the indicator array using the global offset
      // Each entry corresponds to the candle timestamp: candles[i + globalOffset]
      for (let i = 0; i < validLength; i++) {
        const candleTime = candles[i + globalOffset]!.time
        const indicatorEntry: any = { time: candleTime }
        if (computedIndicators['sma']) {
          const smaIndex =
            i + (globalOffset - computedIndicators['sma']!.offset)
          const smaValue = computedIndicators['sma'].values[smaIndex]
          indicatorEntry.sma =
            smaValue !== undefined ? round(smaValue) : undefined
        }
        if (computedIndicators['ema']) {
          const emaIndex =
            i + (globalOffset - computedIndicators['ema']!.offset)
          const emaValue = computedIndicators['ema'].values[emaIndex]
          indicatorEntry.ema =
            emaValue !== undefined ? round(emaValue) : undefined
        }
        if (computedIndicators['rsi']) {
          const rsiIndex =
            i + (globalOffset - computedIndicators['rsi']!.offset)
          const rsiValue = computedIndicators['rsi'].values[rsiIndex]
          indicatorEntry.rsi =
            rsiValue !== undefined ? round(rsiValue) : undefined
        }
        if (computedMACD) {
          const macdIndex = i + (globalOffset - computedMACD.offset)
          const macdValue = computedMACD.macd[macdIndex]
          const signalValue = computedMACD.signal[macdIndex]
          const histValue = computedMACD.hist[macdIndex]
          indicatorEntry.macd = {
            macd: macdValue !== undefined ? round(macdValue) : undefined,
            signal: signalValue !== undefined ? round(signalValue) : undefined,
            hist: histValue !== undefined ? round(histValue) : undefined,
          }
        }
        indicatorsOutput.push(indicatorEntry)
      }

      // Determine how many lines (candles/indicators) are to be finally output
      const numOutput = Math.min(
        validLength,
        this.config.outputCandles ?? this.config.inputCandles,
      )
      // The last numOutput entries from the indicator array:
      const startOutputIndex = validLength - numOutput
      const finalIndicators = indicatorsOutput.slice(startOutputIndex)
      // Corresponding candles from the candles array:
      const finalCandles = candles.slice(
        globalOffset + startOutputIndex,
        globalOffset + validLength,
      )

      // Assembling the final JSON structure
      const result = {
        [this.config.timeframe]: {
          candles: finalCandles,
          indicators: finalIndicators,
        },
      }

      return JSON.stringify(result)
    } catch (error) {
      logger.error(
        `Error fetching OHLCV: exchange=${this.config.exchange}, symbol=${this.config.symbol}, timeframe=${this.config.timeframe}, ${error}`,
      )
      return `{"error": "Error fetching OHLCV data"}`
    }
  }
}
