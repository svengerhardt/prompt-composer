import type { PostProcessor } from './PostProcessor.js'

type PlaceholderValue = string | number | boolean | null | undefined
type PlaceholderMap = Record<string, PlaceholderValue>

/**
 * A content post-processor that replaces placeholders in the format {{key}}
 * with corresponding values from a provided placeholder map.
 */
export class PlaceholderPostProcessor implements PostProcessor {
  private readonly placeholder: PlaceholderMap

  /**
   * Creates a new instance of the PlaceholderPostProcessor.
   * @param placeholder - A map of placeholder keys and their corresponding replacement values.
   */
  constructor(placeholder: PlaceholderMap) {
    this.placeholder = placeholder
  }

  /**
   * Replaces all placeholders in the content string with values from the placeholder map.
   * Placeholders must be in the format {{key}}. If a key is not found, the placeholder remains unchanged.
   *
   * @param content - The string content containing placeholders to be processed.
   * @returns A Promise that resolves to the processed content with placeholders replaced.
   */
  async postProcessContent(content: string): Promise<string> {
    return content.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
      const value = this.placeholder[key]
      return value != null ? String(value) : `{{${key}}}`
    })
  }
}
