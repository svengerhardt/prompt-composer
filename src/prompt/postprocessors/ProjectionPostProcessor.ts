import type { PostProcessor } from './PostProcessor.js'

export type Projection = {
  [key: string]: true | Projection
}

export class ProjectionPostProcessor implements PostProcessor {
  private readonly projection: Projection
  private readonly limit?: number

  constructor(projection: Projection, limit?: number) {
    this.projection = projection
    this.limit = limit
  }

  private findFirstArrayDeep(json: any): any[] | undefined {
    if (Array.isArray(json)) {
      return json
    }
    if (json && typeof json === 'object') {
      for (const key in json) {
        const result = this.findFirstArrayDeep(json[key])
        if (result) {
          return result
        }
      }
    }
    return undefined
  }

  private projectData(data: any, projection: Projection): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.projectData(item, projection))
    }
    if (typeof data === 'object' && data !== null) {
      const result: any = {}
      for (const key in projection) {
        if (data.hasOwnProperty(key)) {
          const proj = projection[key]
          if (typeof proj === 'object' && proj !== null) {
            result[key] = this.projectData(data[key], proj as Projection)
          } else if (proj) {
            result[key] = data[key]
          }
        }
      }
      return result
    }
    return data
  }

  async postProcessContent(content: string): Promise<string> {
    try {
      const jsonData = this.findFirstArrayDeep(JSON.parse(content))
      if (jsonData) {
        let projectedTrades = jsonData.map((trade: any) =>
          this.projectData(trade, this.projection),
        )
        if (this.limit !== undefined && projectedTrades.length > this.limit) {
          projectedTrades = projectedTrades.slice(-this.limit)
        }
        return JSON.stringify(projectedTrades)
      } else {
        return `No array found in json data`
      }
    } catch (error) {
      return `Error parsing json data`
    }
  }
}
