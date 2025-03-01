import type { PostProcessor } from './PostProcessor.js'

/**
 * Type representing a projection schema.
 * Each key maps to either `true` (to include the key) or another nested Projection object.
 */
export type Projection = {
  [key: string]: true | Projection
}

/**
 * ProjectionPostProcessor class is used to filter and limit JSON data based on a projection specification.
 *
 * This class implements the PostProcessor interface, making it useful in post-processing pipelines.
 * It searches through nested JSON to find the first array, projects each element based on a given schema,
 * and optionally limits the number of resulting items.
 */
export class ProjectionPostProcessor implements PostProcessor {
  private readonly projection: Projection
  private readonly limit?: number

  /**
   * Creates an instance of ProjectionPostProcessor.
   *
   * @param {Projection} projection - A projection schema defining which keys to extract.
   *   Each key should map to either true (to include the key) or a nested projection for nested objects.
   * @param {number} [limit] - Optional maximum number of items to include in the final result.
   */
  constructor(projection: Projection, limit?: number) {
    this.projection = projection
    this.limit = limit
  }

  /**
   * Recursively searches for the first array within a nested JSON structure.
   *
   * @param {*} json - The JSON object or value to search through.
   * @returns {any[] | undefined} - The first array found, or undefined if no array exists.
   */
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

  /**
   * Recursively applies the projection schema to the provided data,
   * extracting only the specified keys and nested keys.
   *
   * @param {*} data - The data to project.
   * @param {Projection} projection - The projection schema that defines which keys to include.
   * @returns {*} - The projected data.
   */
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

  /**
   * Processes a JSON string by locating an array within the data,
   * projecting each element based on the projection schema, and limiting results if necessary.
   *
   * @param {string} content - The JSON string to process.
   * @returns {Promise<string>} - A promise that resolves to a JSON string containing the projected data,
   *   or an error message if parsing fails or no array is found.
   */
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
