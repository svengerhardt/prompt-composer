import { promises as fs } from 'fs'
import { BasePromptComponent } from '../BasePromptComponent.js'
import logger from '../../../logger.js'

interface FileReaderComponentConfig {
  description: string
  path: string
}

const defaultConfig: FileReaderComponentConfig = {
  description: '',
  path: '',
}

export class FileReaderComponent extends BasePromptComponent<FileReaderComponentConfig> {
  constructor(config: Partial<FileReaderComponentConfig> = {}) {
    const mergedConfig = { ...defaultConfig, ...config }
    super(mergedConfig.description, mergedConfig)
  }

  async getContent(): Promise<string> {
    try {
      return await fs.readFile(this.config.path, 'utf8')
    } catch (error) {
      logger.error(`Error reading file: path=${this.config.path}, ${error}`)
      return `{"error": "Error reading file"}`
    }
  }
}
