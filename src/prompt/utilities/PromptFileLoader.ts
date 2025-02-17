import { readFileSync } from 'fs'

export class PromptFileLoader {
  static loadPrompt(path: string): string {
    return readFileSync(path, 'utf8')
  }
}
