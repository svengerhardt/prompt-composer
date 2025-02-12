'use strict'

import { promises as fs } from 'fs'
import logger from '../../logger.js'

export class PromptFileReader {
  async load(path: string): Promise<string> {
    try {
      return await fs.readFile(path, 'utf8')
    } catch (error) {
      logger.error(`Error reading prompt file: path=${path}, ${error}`)
      return `{"error": "Error reading prompt file"}`
    }
  }
}
