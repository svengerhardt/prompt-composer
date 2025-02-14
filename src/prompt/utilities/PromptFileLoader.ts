'use strict'

import { promises as fs } from 'fs'

export class PromptFileLoader {
  async loadPrompt(path: string): Promise<string> {
    return await fs.readFile(path, 'utf8')
  }
}
