import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// If __dirname does not exist (e.g. in ESM)
const __dirnameUniversal =
  typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url))

export class PromptLoader {
  static getPromptPath(relativePath: string): string {
    const packageRoot = join(__dirnameUniversal, '../../../')
    return join(packageRoot, 'assets', 'prompts', relativePath)
  }

  static loadPrompt(relativePath: string): string {
    const filePath = this.getPromptPath(relativePath)
    return readFileSync(filePath, 'utf8')
  }
}
